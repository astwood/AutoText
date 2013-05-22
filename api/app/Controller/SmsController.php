<?php
App::uses('Controller', 'Controller');

class SmsController extends AppController {
    
    public $uses = array('Sms', 'InternationalNumber');
    public $components = array('Message');
    
    /**
     * Schedule a new message
     * @param string $smsId
     */
    public function schedule($smsId = '') {
        $fail = true;
        if (!empty($this->request->data)) {
            $this->request->data['user_id'] = Configure::read('User.id');
            $this->request->data['user_country_code'] = Configure::read('User.country');
            if (!empty($smsId)) $this->request->data['id'] = $smsId;
            $this->Sms->create();
            if ($res = $this->Sms->save($this->request->data)) {
                // Delete old schedule if editing single
                if (isset($this->request->data['oldSchedule']) && !empty($this->request->data['oldSchedule'])) {
                    $this->Sms->Schedule->deleteOld($this->request->data['oldSchedule']);
                }
                $this->Sms->User->updateNoCreditStatuses(Configure::read('User.id'));
                
                $fail = false;
                $this->renderJson(true, $res['Sms']['spam_alert']);
            } else {
                $fail = false;
                $this->renderJson(false, array_values($this->Sms->invalidFields()));
            }
        }
        
        if ($fail) {
            $this->renderJson();
        }
    }
    
    /**
     * Check if user passed data validates for this part of scheduling/editing a message
     */
    public function validates() {
        $fail = true;
        if (!empty($this->request->data)) {
            $this->request->data['user_id'] = Configure::read('User.id');
            $this->request->data['user_country_code'] = $this->InternationalNumber->getCodeByCountry(Configure::read('User.country'));
            if ($this->Sms->validatePart($this->request->data)) {
                $fail = false;
                $this->renderJson(true);
            }
        }
        
        if ($fail) {
            $this->renderJson();
        }
    }
    
    /**
     * Edit a message
     * @param string $smsId 
     */
    public function edit($smsId) {
        $fail = true;
        
        if (!empty($this->request->data)) {
            // Save SMS data
            if ($this->Sms->userHasAccess(Configure::read('User.id'), $smsId)) {
                $this->request->data['user_id'] = Configure::read('User.id');
                $this->request->data['user_country_code'] = Configure::read('User.country');
                $this->Sms->id = $smsId;
                if ($res = $this->Sms->save($this->request->data)) {
                    $this->Sms->User->updateNoCreditStatuses(Configure::read('User.id'));
                    
                    $fail = false;
                    $this->renderJson(true, $res['Sms']['spam_alert']);
                } else {
                    $fail = false;
                    $this->renderJson(false, array_values($this->Sms->invalidFields()));
                }
            } else {
                if (!$this->Sms->exists($smsId)) {
                    $fail = false;
                    $this->schedule($smsId);
                }
            }
        }
        
        if ($fail) {
            $this->renderJson();
        }
    }
    
    /**
     * Delete message
     * @param string $smsId 
     * @param string $scheduleId
     */
    public function delete($smsId, $scheduleId = '') {
        $fail = true;
        
        if ($this->Sms->userHasAccess(Configure::read('User.id'), $smsId)) {
            if (empty($scheduleId)) {
                $doneOrDelete = false;
                if (!$this->Sms->hasSentSchedules($smsId)) {
                    $doneOrDelete = $this->Sms->delete($smsId);
                } else {
                    $doneOrDelete = true;
                }

                if ($doneOrDelete) {
                    $conditions = array(
                        'Schedule.sms_id' => $smsId,
                        'Schedule.status' => array(
                            'scheduled',
                            'no_credit',
                            'spam_alert'
                        ),
                        'Schedule.processing' => 0,
                        'Schedule.done' => 0
                    );
                    if ($this->Sms->Schedule->deleteAll($conditions)) {
                        $this->Sms->User->updateNoCreditStatuses(Configure::read('User.id'));

                        $fail = false;
                        $this->renderJson(true);
                    }
                }
            } else {
                $time = $this->Sms->Schedule->getTime($scheduleId);
                $conditions = array(
                    'Schedule.id' => $scheduleId,
                    'Schedule.sms_id' => $smsId,
                    'Schedule.status' => array(
                        'scheduled',
                        'spam_alert'
                    ),
                    'Schedule.processing' => 0,
                    'Schedule.done' => 0
                );
                if ($this->Sms->Schedule->deleteAll($conditions)) {
                    $this->Sms->excludeDate($smsId, $time);
                    $this->Sms->User->updateNoCreditStatuses(Configure::read('User.id'));
                    
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
     * View a message
     * @param string $scheduleId 
     */
    public function view($smsId, $scheduleId) {
        $fail = true;
        
        if ($this->Sms->userHasAccess(Configure::read('User.id'), $smsId)) {
            $res = $this->Sms->getSms($smsId, $scheduleId);
            if (!empty($res)) {
                $fail = false;
                $this->renderJson(true, $res);
            }
        }
        
        if ($fail) {
            $this->renderJson();
        }
    }
    
    /**
     * Called by SMS provider to confirm delivery of messages
     */
    public function receipt() {
        $data = $this->request->data;
        if (!empty($data)) {
            if (isset($data['number']) && isset($data['status']) && isset($data['customID'])) {
                $data['customID'] = explode('&', $data['customID']);
                if (count($data['customID']) == 2) {
                    $data['id'] = $data['customID'][0];
                    $data['receipt'] = $data['customID'][1];
                    unset($data['customID']);

                    if ($this->Sms->Schedule->validReceipt($data['id'], $data['receipt'])) {
                        switch ($data['status']) {
                            case 'D':
                                $this->Sms->Schedule->status($data['id'], 'delivered');
                                break;
                            case 'U':
                                $this->Sms->Schedule->status($data['id'], 'failed');
                                break;
                            case 'I':
                                $this->Sms->Schedule->status($data['id'], 'delivered_errors');
                                break;
                            case '?':
                                $this->Sms->Schedule->status($data['id'], 'delivered_errors');
                                break;
                        }
                    }
                }
            }
        }
    }
    
    /**
     * List scheduled or sent messages
     * @param string $type 
     */
    public function index($type = 'scheduled') {
        $fail = true;
        
        switch ($type) {
            case 'scheduled':
            case 'sent':
                $res = array();
                $res['schedules'] = $this->Sms->{'retrieve'.ucfirst($type)}(Configure::read('User.id'));
                $res['show_spam_fail_notification'] = Configure::read('User.show_spam_fail_notification');
                
                $fail = false;
                $this->renderJson(true, $res);
                break;
        }
        
        if ($fail) {
            $this->renderJson();
        }
    }
    
    /**
     * Return description for a status
     * @param string $status 
     */
    public function getStatusDescription($status) {
        $this->renderJson(true, $this->Sms->getStatusDescription($status));
    }
    
}
