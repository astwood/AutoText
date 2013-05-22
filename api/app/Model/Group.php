<?php
App::uses('Model', 'Model');

class Group extends AppModel {
    
    public $hasMany = array('GroupContact');
    public $order = array('Group.name ASC');
    
    public $validate = array(
        'name' => array(
            'minLength' => array(
                'rule' => array('minLength', 1),
                'required' => true,
                'allowEmpty' => false
            )
        )
    );
    
    public function beforeValidate($options = array()) {
        // Set validation messages
        $this->validate['name']['minLength']['message'] = __('Please enter your group name.');
        
        return parent::beforeValidate($options);
    }
    
    public function afterSave($created) {
        $groupId = isset($this->id) ? $this->id : $this->getInsertID();
        $this->GroupContact->deleteAll(array(
            'GroupContact.group_id' => $groupId
        ));
        if (!empty($this->data['Group']['contacts'])) {
            $contacts = $this->data['Group']['contacts'];
            if (!empty($contacts)) {
                foreach ($contacts as $contact) {
                    $contact['phone_number_user'] = $contact['phone_number'];
                    $this->formatNumbers($contact['phone_number'], Configure::read('User.country'));
                    if (!$this->hasContact($groupId, $contact['phone_number'])) {
                        $contact['phone_number'] = $contact['phone_number_user'];
                        $contact['group_id'] = $groupId;
                        $this->GroupContact->create();
                        $this->GroupContact->save($contact);
                    }
                }
            }
        }
        
        return parent::afterSave($created);
    }
    
    /**
     * Validate part of a save request
     * @param array $data
     * @return boolean 
     */
    public function validatePart($data = array()) {
        if (!isset($data['part'])) return false;
        $mdl = $this;
        switch ($data['part']) {
            case 'contact':
                $validate = array();
                $validate['name'] = $this->GroupContact->validate['name'];
                $validate['phone_number'] = $this->GroupContact->validate['phone_number'];
                $this->GroupContact->validate = $validate;
                $mdl = $this->GroupContact;
                break;
        }
        $mdl->set($data);
        return $mdl->validates();
    }
    
    /**
     * Retrieve all groups for specific user
     * @param string $userId
     * @return array
     */
    public function retrieveAll($userId) {
        $res = $this->find('all', array(
            'conditions' => array(
                'Group.user_id' => $userId
            ),
            'fields' => array(
                'Group.id',
                'Group.name' 
            )
        ));
        
        foreach ($res as &$row) {
            $row['Group']['members'] = '';
            $names = array();
            if (!empty($row['GroupContact'])) {
                foreach ($row['GroupContact'] as $contact) {
                    array_push($names, $contact['name']);
                }
            }
            sort($names);
            $row['Group']['members'] = implode(', ', $names);
            $row = $row['Group'];
        }
        return $res;
    }
    
    /**
     * Return Group data
     * @param string $groupId
     */
    public function getGroup($groupId) {
        $this->Behaviors->attach('Containable');
        $res = $this->find('first', array(
            'conditions' => array(
                'Group.id' => $groupId
            ),
            'fields' => array(
                'Group.id',
                'Group.name'
            ),
            'contain' => array(
                'GroupContact' => array(
                    'fields' => array(
                        'GroupContact.name',
                        'GroupContact.phone_number',
                        'GroupContact.phone_number_user'
                    )
                )
            )
        ));
        
        if (isset($res['GroupContact']) && !empty($res['GroupContact'])) {
            $names = array();
            foreach ($res['GroupContact'] as &$contact) {
                unset($contact['group_id']);
                $contact['phone_number'] = $contact['phone_number_user'];
                array_push($names, $contact['name']);
            }
            asort($names);
            
            $tmp = array();
            foreach (array_keys($names) as $key) {
                array_push($tmp, $res['GroupContact'][$key]);
            }
            $res['GroupContact'] = $tmp;
        }
        return $res;
    }
    
    public function hasContact($groupId, $phoneNumber) {
        return $this->GroupContact->find('count', array(
            'conditions' => array(
                'GroupContact.group_id' => $groupId,
                'GroupContact.phone_number' => $phoneNumber
            ),
            'recursive' => -1
        )) > 0;
    }
    
}
