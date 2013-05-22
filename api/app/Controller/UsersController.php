<?php
App::uses('Controller', 'Controller');

class UsersController extends AppController {
    
    public $uses = array('InternationalNumber');
    public $components = array('Message');
    
    /**
     * Used to confirm if user provided details are valid credentials and
     * returns phone number to pass as username in all subsequent API calls
     */
    public function login() {
        if ($res = $this->User->validUser($this->request->data)) {
            $this->renderJson(true, $res);
        } else {
            $this->renderJson();
        }
    }
    
    /**
     * Register users
     */
    public function register() {
        $fail = true;
        
        if (!empty($this->request->data)) {
            // Save user data
            $failNum = true;
            
            if ($id = $this->User->allowedToRegister($this->request->data)) {
                $failNum = false;
                $this->User->id = $id;
            } else if ($id !== false) {
                if ($id !== false) {
                    $failNum = false;
                    $this->User->create();
                }
            }
            
            if (!$failNum) {
                if ($res = $this->User->save($this->request->data)) {
                    $userId = isset($this->User->id) ? $this->User->id : $this->User->getInsertID();
                    // Generate verification PIN
                    $pinData = array(
                        'pin' => $this->User->generatePin($userId)
                    );

                    // Send verification SMS to user
                    if ($this->Message->sms(Configure::read('Settings.App_name'), $res['User']['phone_number'], 'register_verify', $pinData) !== false) {
                        $fail = false;
                        $this->renderJson(true, array(
                            'phone_number' => $this->User->getPhoneFromID($userId),
                            'exit_code' => ClassRegistry::init('InternationalNumber')->getExitCodeByCountry($this->User->getCountryFromID($userId))
                        ));
                    }
                }
            }
        }
        
        if ($fail) {
            $this->renderJson();
        }
    }
    
    /**
     * Forgotten password
     */
    public function forgotten() {
        $fail = true;
        
        if (!empty($this->request->data)) {
            if ($userId = $this->User->getIdFromPhone($this->request->data)) {
                // Generate verification PIN
                $pinData = array(
                    'pin' => $this->User->generatePin($userId)
                );
                
                // Send verification SMS to user
                if ($this->Message->sms(Configure::read('Settings.App_name'), $this->request->data['phone_number'], 'forgotten_verify', $pinData) !== false) {
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
     * Verify user account actions (i.e. registration, forgotten password)
     * @param string $mode
     */
    public function verify($mode = '') {
        $fail = true;
        
        $modes = array('register', 'forgotten');
        if (in_array($mode, $modes)) {
            if (!empty($this->request->data)) {
                // Verify user ID matches up with verificiation PIN
                if ($this->User->validPin($this->request->data)) {
                    switch ($mode) {
                        case 'register':
                            // Activate user & expire verification PIN
                            if ($this->User->activateUser($this->request->data)) {
                                $fail = false;
                                $this->renderJson(true);
                            }
                            break;
                        
                        case 'forgotten':
                            // Change password & expire verification PIN
                            if ($this->User->changePassword($this->request->data)) {
                                $fail = false;
                                $this->renderJson(true);
                            }
                            break;
                    }
                }
            }
        }
        
        if ($fail) {
            $this->renderJson();
        }
    }
    
    /**
     * User account details
     */
    public function account() {
        $this->renderJson(true, $this->User->getDetails(Configure::read('User.id')));
    }
    
    /**
     * List all supported countries
     */
    public function countries() {
        $this->renderJson(true, $this->InternationalNumber->getAll());
    }
    
    /**
     * Used to notify admin of invalid international number formatting reports from users
     */
    public function formatting() {
        $fail = true;
        
        $data = $this->request->data;
        if (isset($data['country']) && isset($data['phone_number']) && !$this->User->alreadyReportedInvalid($data)) {
            $this->User->reportInvalid($data);
            $this->User->formatNumbers($data['phone_number'], $data['country']);
            $this->Message->email(Configure::read('Settings.App_adminEmail'), __(Configure::read('Settings.App_name').' invalid international number formatting report'), 'invalid_number_formatting', $data);

            $fail = false;
            $this->renderJson(true);
        }
        
        if ($fail) {
            $this->renderJson();
        }
    }
    
    /**
     * Return user's remaining credits
     */
    public function getCredits() {
        $this->renderJson(true, $this->User->getAllCredits(Configure::read('User.id')));
    }
    
    /**
     * Return country names and credit costs
     */
    public function getInternationalCredits() {
        $this->renderJson(true, ClassRegistry::init('InternationalNumber')->getAllCredits());
    }
    
    /**
     * Return country exit code
     */
    public function getExitCode($country = '') {
        $this->renderJson(true, ClassRegistry::init('InternationalNumber')->getExitCodeByCountry($country));
    }
    
    /**
     * Set user's account as not having to display spam fail notification
     */
    public function shownSpamFailNotification() {
        $this->User->shownSpamFailNotification(Configure::read('User.id'));
        $this->renderJson(true);
    }
}
