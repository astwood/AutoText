<?php
App::uses('Controller', 'Controller');

class GroupsController extends AppController {
    
    public $uses = array('Group', 'InternationalNumber');
    
    /**
     * Create a new group
     */
    public function add() {
        $fail = true;
        
        if (!empty($this->request->data)) {
            // Save Group data
            $this->request->data['user_id'] = Configure::read('User.id');
            $this->Group->create();
            if ($this->Group->save($this->request->data)) {
                $fail = false;
                $this->renderJson(true);
            }
        }
        
        if ($fail) {
            $this->renderJson();
        }
    }
    
    /**
     * Check if user passed data validates for this part of creating a group/contact
     */
    public function validates() {
        $fail = true;
        if (!empty($this->request->data)) {
            if ($this->Group->validatePart($this->request->data)) {
                $fail = false;
                $this->renderJson(true);
            }
        }
        
        if ($fail) {
            $this->renderJson();
        }
    }
    
    /**
     * Edit a group
     */
    public function edit($groupId) {
        $fail = true;
        
        if (!empty($this->request->data)) {
            // Save Group data
            if ($this->Group->userHasAccess(Configure::read('User.id'), $groupId)) {
                $this->request->data['user_id'] = Configure::read('User.id');
                $this->Group->id = $groupId;
                if ($this->Group->save($this->request->data)) {
                    $fail = false;
                    $this->renderJson(true);
                }
            }
        }
        
        if ($fail) {
            $this->renderJson();
        }
    }
    
    /**
     * List groups
     */
    public function index() {
        $res = $this->Group->retrieveAll(Configure::read('User.id'));
        $this->renderJson(true, $res);
    }
    
    /**
     * Delete a group
     * @param string $groupId
     */
    public function delete($groupId) {
        $fail = true;
        
        if ($this->Group->userHasAccess(Configure::read('User.id'), $groupId)) {
            if ($this->Group->delete($groupId)) {
                $conditions = array(
                    'GroupContact.group_id' => $groupId
                );
                if ($this->Group->GroupContact->deleteAll($conditions)) {
                    $fail = false;
                    $this->renderJson(true);
                }
            }
        }
        
        if ($fail) {
            $this->renderJson();
        }
    }
    
    /**
     * View a group's info
     */
    public function view($groupId) {
        $fail = true;
        
        if ($this->Group->userHasAccess(Configure::read('User.id'), $groupId)) {
            $res = $this->Group->getGroup($groupId);
            if (!empty($res)) {
                $fail = false;
                $this->renderJson(true, $res);
            }
        }
        
        if ($fail) {
            $this->renderJson();
        }
    }
    
}