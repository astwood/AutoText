<?php
App::uses('Model', 'Model');

class GroupContact extends AppModel {
    
    public $belongsTo = array('Group');
    public $order = array('GroupContact.name ASC');
    
    public $validate = array(
        'name' => array(
            'minLength' => array(
                'rule' => array('minLength', 1),
                'required' => true,
                'allowEmpty' => false
            )
        ),
        'phone_number' => array(
            'minLength' => array(
                'rule' => array('minLength', 1),
                'required' => true,
                'allowEmpty' => false,
                'last' => true
            ),
            'validNumbers' => array(
                'rule' => array('validPhoneNumbers'),
                'required' => true
            )
        )
    );
    
    public function beforeValidate($options = array()) {
        // Set validation messages
        $this->validate['name']['minLength']['message'] = __('Please enter your contact\'s name.');
        $this->validate['phone_number']['minLength']['message'] = __('Please enter your contact\'s phone number.');
        $this->validate['phone_number']['validNumbers']['message'] = __('Your contact\'s phone number is invalid.');
        
        return parent::beforeValidate($options);
    }
    
    /**
     * Checks if number is in a valid format
     * @param array $check
     * @return boolean
     */
    public function validPhoneNumbers($check) {
        foreach($check as $field => $row) {
            $row = $rowUsers = explode(',', $row);
            
            foreach($row as &$recipient) {
                if (preg_match('/^\+?\d+$/', $recipient) != 1 || strlen($recipient) < 11 || strlen($recipient) > 16) { // All digits (or +) and 11-16 characters
                    return false;
                } else if (ClassRegistry::init('InternationalNumber')->validCountryCode($recipient, Configure::read('User.country')) === false) { // Invalid/unsupported country code
                    return false;
                }
            }
            
            // Remove duplicates
            $row = array_unique($row);
            foreach ($rowUsers as $key => $val) {
                if (!isset($row[$key])) unset($rowUsers[$key]);
            }
            
            // Maximum of 1000 numbers
            if (count($row) > 1000) return false;
            
            $this->data[$this->alias]['phone_number_user'] = implode(',', $rowUsers);
            $this->data[$this->alias][$field] = implode(',', $row);
            break;
        }
        return true;
    }
    
}
