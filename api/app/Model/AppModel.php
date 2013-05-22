<?php
App::uses('Model', 'Model');
class AppModel extends Model {
    
    /**
     * Had to overwrite CakePHP default saveField as it kept calling Model callbacks
     * @param string $name
     * @param mixed $value 
     */
    public function saveField($name, $value) {
        $this->query('UPDATE `'.Inflector::tableize($this->alias).'` SET `'.$name.'` = "'.$value.'" WHERE `'.$this->primaryKey.'` = "'.$this->id.'";');
    }
    
    /**
     * Formats international/local numbers based on user number and country
     * @param string $numbers
     * @param string $country
     */
    public function formatNumbers(&$numbers = '', $country = '') {
        if (!empty($numbers) && !empty($country)) {
            $numbers = explode(',', $numbers);
            if (!empty($numbers)) {
                $this->InternationalNumber = ClassRegistry::init('InternationalNumber');
                
                foreach($numbers as &$number) {            
                    $numberBare = '';
                    $res = $this->InternationalNumber->findByCountryNameCode($country);
                    if (!empty($res)) {
                        $res = $res['InternationalNumber'];

                        // Strip number down to the basics
                        if (substr($number, 0, strlen($res['exit_code'])+strlen($res['country_code'])) == $res['exit_code'].$res['country_code']) {
                            $numberBare = substr($number, strlen($res['exit_code'])+strlen($res['country_code']));
                        } else if (substr($number, 0, strlen($res['trunk_code'])) == $res['trunk_code']) {
                            $numberBare = substr($number, strlen($res['trunk_code']));
                        }
                        if (!empty($numberBare)) $number = $res['country_code'].$numberBare;
                    }
                }
            }
            $numbers = implode(',', $numbers);
        }
    }
    
    /**
     * Return true if user has access to a record
     * @param string $userId
     * @param string $smsId
     * @return boolean 
     */
    public function userHasAccess($userId, $id) {
        return $this->find('count', array(
            'conditions' => array(
                $this->alias.'.user_id' => $userId,
                $this->alias.'.id' => $id
            ),
            'recursive' => -1
        )) > 0;
    }
    
}
