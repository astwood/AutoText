<?php
App::uses('Model', 'Model');

class InternationalNumber extends AppModel {
    
    public $primaryKey = 'country_name_code';
    public $displayField = 'country_name';
    public $order = 'country_name ASC';
    
    /**
     * Validate if country is supported or not from country name code
     * @param string $country
     * @return boolean 
     */
    public function validCountry($country = '') {
        return $this->find('count', array(
            'conditions' => array(
                'InternationalNumber.country_name_code' => strtoupper($country)
            ),
            'recursive' => -1
        )) > 0;
    }
    
    /**
     * Return all country codes
     * @return array 
     */
    public function getAllCountryAndAreaCodes() {
        return $this->find('all', array(
            'fields' => array(
                'InternationalNumber.country_code',
                'InternationalNumber.area_codes'
            )
        ));
    }
    
    /**
     * Extract country code from number
     * @param string $number
     * @param string $userCountry
     * @return string|false 
     */
    public function validCountryCode(&$number, $userCountry = '') {
        $this->InternationalNumber = ClassRegistry::init('InternationalNumber');
        $res = $this->InternationalNumber->findByCountryNameCode($userCountry);
        if (!empty($res)) {
            $res = $res['InternationalNumber'];
            $numberBare = '';
            
            if (substr($number, 0, strlen($res['exit_code'])) == $res['exit_code']) {
                $allCountries = $this->InternationalNumber->getAllCountryAndAreaCodes();
                $numberBare = substr($number, strlen($res['exit_code']));
                $sendingToRes = array();
                foreach ($allCountries as $country) {
                    if (substr($numberBare, 0, strlen($country['InternationalNumber']['country_code'])) == $country['InternationalNumber']['country_code']) {
                        $sendingToRes['country_code'] = $country['InternationalNumber']['country_code'];
                        if (empty($sendingToRes['area_codes'])) $sendingToRes['area_codes'] = array();
                        $sendingToRes['area_codes'] = array_merge($sendingToRes['area_codes'], explode(',', $country['InternationalNumber']['area_codes']));
                    }
                }
                
                if (!empty($sendingToRes)) {
                    $numberBare = substr($numberBare, strlen($sendingToRes['country_code']));
                    
                    // Check area code if necessary
                    if (!empty($sendingToRes['area_codes'])) {
                        $foundAreaCode = false;
                        foreach ($sendingToRes['area_codes'] as $areaCode) {
                            if (substr($numberBare, 0, strlen($areaCode)) == $areaCode) {
                                $numberBare = substr($numberBare, strlen($areaCode));
                                $foundAreaCode = true;
                                break;
                            }
                        }

                        if (!$foundAreaCode) $numberBare = '';
                    }
                    
                    $number = $sendingToRes['country_code'].$numberBare;
                } else {
                    $numberBare = '';
                }
            } else if (substr($number, 0, strlen($res['trunk_code'])) == $res['trunk_code']) {
                $numberBare = substr($number, strlen($res['trunk_code']));
                
                // Check area code if necessary
                if (!empty($res['area_codes'])) {
                    $foundAreaCode = false;
                    $areaCodes = explode(',', $res['area_codes']);
                    foreach ($areaCodes as $areaCode) {
                        if (substr($numberBare, 0, strlen($areaCode)) == $areaCode) {
                            $foundAreaCode = true;
                            break;
                        }
                    }
                    
                    if (!$foundAreaCode) {
                        $numberBare = '';
                    }
                }
                
                $number = $res['country_code'].$numberBare;
            } else {
                return false;
            }
        } else {
            return false;
        }
        return true;
    }
    
    /**
     * Return country code from country name code
     * @param string $country
     * @return string 
     */
    public function getCodeByCountry($country = '') {
        $res = $this->find('first', array(
            'conditions' => array(
                'InternationalNumber.country_name_code' => strtoupper($country)
            ),
            'fields' => array(
                'InternationalNumber.country_code'
            )
        ));
        if (!empty($res)) return $res['InternationalNumber']['country_code'];
        return false;
    }
    
    /**
     * Return exit code from country name code
     * @param string $country
     * @return string
     */
    public function getExitCodeByCountry($country = '') {
        $res = $this->find('first', array(
            'conditions' => array(
                'InternationalNumber.country_name_code' => strtoupper($country)
            ),
            'fields' => array(
                'InternationalNumber.exit_code'
            )
        ));
        if (!empty($res)) return $res['InternationalNumber']['exit_code'];
        return false;
    }
    
    /**
     * Get all available countries as a list
     * @return array 
     */
    public function getAll() {
        return $this->find('list', array(
            'conditions' => array(
                'InternationalNumber.available' => 1
            )
        ));
    }
    
    /**
     * Return all country names, name codes and credits
     * @return array|boolean
     */
    public function getAllCredits() {
        $return = array();
        $res = $this->find('all', array(
            'fields' => array(
                'InternationalNumber.country_name',
                'InternationalNumber.country_name_code',
                'InternationalNumber.credits'
            )
        ));
        if (!empty($res)) {
            foreach ($res as $row) {
                $return[$row['InternationalNumber']['country_name_code']] = array(
                    'name' => $row['InternationalNumber']['country_name'],
                    'credits' => $row['InternationalNumber']['credits']
                );
            }
        }
        return $return;
    }
    
}
