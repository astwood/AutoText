<?php
App::uses('Model', 'Model');
App::import('Controller', 'Controller');
App::import('Component', 'Message');

class Sms extends AppModel {
    
    // green - 92d050
    // amber - f0b05f
    // red - c80408
    // grey - a3a3a3
    public $statuses = array(
        'unsynced' => array( // Stored on user's device (not in DB, shows in Scheduled, not sent, not validated)
            'text' => 'Unsynced',
            'colour' => 'a3a3a3',
            'description' => 'We can\'t sync this message with our system. Please connect to a mobile network or internet connection.'
        ),
        'draft' => array( // Stored on user's device (not in DB, shows in Scheduled, not sent, not validated)
            'text' => 'Draft',
            'colour' => 'a3a3a3',
            'description' => 'Draft message - not currently scheduled'
        ),
        'scheduled' => array( // Scheduled with no errors (in DB, shows in Scheduled, not sent)
            'text' => 'Scheduled',
            'colour' => '92d050',
            'description' => 'This message has been successfully scheduled and will be sent as scheduled - even if your phone is switched off or without signal!'
        ),
        'no_credit' => array( // Not enough credit to schedule this message (in DB, shows in Scheduled, not sent)
            'text' => 'Flagged',
            'colour' => 'c80408',
            'description' => 'You don\'t have enough credits to send this message – <a href="#" class="purchase-link">please purchase now</a>.<br /><br />Please note this message will not be sent until your credit balance has been updated.'
        ),
        'spam_alert' => array( // Flagged as spam automatically (in DB, shows in Scheduled, not sent)
            'text' => 'Flagged',
            'colour' => 'f0b05f',
            'description' => 'Unfortunately this message has been flagged by our system for potential SPAM content and will be reviewed by our team before it is allowed to send.'
        ),
        'spam_fail' => array( // Admin has declined message flagged as spam (in DB, shows in History, not sent)
            'text' => 'Flagged',
            'colour' => 'c80408',
            'description' => 'Unfortunately this message has been reviewed and found to have SPAM content within it and rejected by our team. This message will be moved to your History folder. Please be warned that if multiple SPAM messages are scheduled from the same account that account may be frozen. If you have any queries on SPAM please review our <a href="#" class="terms">SPAM guidelines</a>.'
        ),
        'delivered' => array( // Confirmed delivery from SMS provider (in DB, shows in History, sent)
            'text' => 'Delivered',
            'colour' => '',
            'description' => 'Your message has been successfully delivered to all recipients.'
        ),
        'delivered_errors' => array( // Invalid/timeout/failed from SMS provider for some recipients (in DB, shows in History, not sent)
            'text' => 'Sent with Errors',
            'colour' => '',
            'description' => 'Unfortunately this message could not be delivered to some of its recipients as their phone number was invalid or because their phone wasn\'t available. See the message recipients for more details.'
        ),
        'failed' => array( // Timeout/fail from SMS provider for all recipients (in DB, shows in History, not sent)
            'text' => 'Failed',
            'colour' => '',
            'description' => 'Unfortunately we couldn\'t successfully send this message to any of the recipient\'s – either because their phone or mobile network is not available.'
        ),
        'pending' => array( // No delivery report from SMS provider yet (in DB, shows in History, possibly sent)
            'text' => 'Sent',
            'colour' => '',
            'description' => 'Your message has been sent!'
        )
    );
    
    public $belongsTo = array('User');
    public $hasMany = array(
        'Schedule' => array(
            'foreignKey' => 'sms_id'
        )
    );
    public $recursive = -1;
    
    public $validate = array(
        'recipient' => array(
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
        ),
        'content' => array(
            'minLength' => array(
                'rule' => array('minLength', 1),
                'required' => true,
                'allowEmpty' => false
            ),
            'maxLength' => array(
                'rule' => array('maxLength', 764),
                'required' => true,
                'allowEmpty' => false
            )
        ),
        'time' => array(
            'minLength' => array(
                'rule' => array('minLength', 1),
                'required' => true,
                'allowEmpty' => false,
                'last' => true
            ),
            'validTime' => array(
                'rule' => array('validTime'),
                'required' => true
            )
        ),
        'repeat_options' => array(
            'minLength' => array(
                'rule' => array('minLength', 0),
                'required' => true,
                'allowEmpty' => true,
                'last' => true
            ),
            'validOptions' => array(
                'rule' => array('validRepeatOptions'),
                'required' => true
            )
        ),
        'reminder' => array(
            'minLength' => array(
                'rule' => array('minLength', 1),
                'required' => true,
                'allowEmpty' => false,
                'last' => true
            ),
            'boolean' => array(
                'rule' => array('boolean'),
                'required' => true
            )
        )
    );
    
    public $autoCreateNewSms = false;
    
    /**
     * Add deleted date to Sms
     * @param string $smsId
     * @param string $time 
     */
    public function excludeDate($smsId, $time) {
        $time = strtotime($time);
        $timesArray = $this->getDeletedDates($smsId);
        if (!in_array($time, $timesArray)) {
            array_push($timesArray, $time);
            $this->id = $smsId;
            $this->saveField('deleted_dates', json_encode($timesArray));
        }
    }
    
    /**
     * Get deleted dates for Sms
     * @param array $smsId
     * @return array|boolean
     */
    public function getDeletedDates($smsId) {
        $res = $this->find('first', array(
            'conditions' => array(
                'Sms.id' => $smsId
            ),
            'fields' => array(
                'Sms.deleted_dates'
            )
        ));
        if (!empty($res)) {
            if (empty($res['Sms']['deleted_dates'])) {
                $return = array();
            } else {
                $return = json_decode($res['Sms']['deleted_dates']);
            }
            return $return;
        }
        return false;
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
            
            $this->data[$this->alias]['recipient_user'] = implode(',', $rowUsers);
            $this->data[$this->alias][$field] = implode(',', $row);
            break;
        }
        return true;
    }
    
    /**
     * Checks if JSON string is valid for SMS repeat options
     * @param array $check
     * @return boolean 
     */
    public function validRepeatOptions($check) {
        $check['repeat_options'] = json_decode($check['repeat_options']);
        if (is_object($check['repeat_options'])) {
            if (isset($check['repeat_options']->D)
                    && isset($check['repeat_options']->W)
                    && isset($check['repeat_options']->M)
                    && isset($check['repeat_options']->Y)
                    && isset($check['repeat_options']->WD)) return true;
        }
        return false;
    }
    
    /**
     * Checks if time is valid UNIX timestamp and is in the future
     * @param array $check
     * @return boolean 
     */
    public function validTime($check) {
        return is_numeric($check['time'])
            && ($check['time'] <= PHP_INT_MAX)
            && ($check['time'] >= ~PHP_INT_MAX)
            && $check['time'] > time();
    }
    
    public function beforeValidate($options = array()) {
        // Set validation messages            
        $this->validate['recipient']['minLength']['message'] = __('Please enter your recipient(s).');
        $this->validate['recipient']['validNumbers']['message'] = __('Some of your recipients are invalid.');
        $this->validate['content']['minLength']['message'] = __('Please enter your message.');
        $this->validate['content']['maxLength']['message'] = __('Your message can not exceed 764 characters.');
        $this->validate['time']['minLength']['message'] = __('Please enter the scheduled date and time.');
        $this->validate['time']['validTime']['message'] = __('Please enter a valid date and time.');
        $this->validate['repeat_options']['minLength']['message'] = __('Please enter repeat options.');
        $this->validate['repeat_options']['validOptions']['message'] = __('Please enter valid repeat options.');
        $this->validate['reminder']['minLength']['message'] = __('Please select whether this message is a self reminder or not.');
        $this->validate['reminder']['boolean']['message'] = __('Please enter a valid selection for whether this message is a self reminder or not.');

        return parent::beforeValidate($options);
    }
    
    /**
     * Validate part of a save request
     * @param array $data
     * @return boolean 
     */
    public function validatePart($data = array()) {
        $this->set($data);
        if (!isset($this->data['Sms']['part'])) return false;
        switch ($this->data['Sms']['part']) {
            case 'recipient_content':
                $validate = array();
                $validate['recipient'] = $this->validate['recipient'];
                $validate['content'] = $this->validate['content'];
                $validate['reminder'] = $this->validate['reminder'];
                $this->validate = $validate;
                break;
            
            case 'time':
                $validate = array();
                $validate['time'] = $this->validate['time'];
                $this->validate = $validate;
                break;
            
            case 'name':
                // `name` has no validation
                $validate = array();
                $this->validate = $validate;
                break;
            
            case 'repeat_options':
                $validate = array();
                $validate['repeat_options'] = $this->validate['repeat_options'];
                $this->validate = $validate;
                break;
        }
        return $this->validates();
    }
    
    public function beforeSave($options = array()) {
        // Create new SMS if already sent
        if (isset($this->id) && !empty($this->id)) {
            if ($this->hasSentSchedules($this->id)) {
                $this->saveField('end_date', strtotime($this->getLastScheduleDate($this->id, true)));
                
                $this->autoCreateNewSms = $this->id;
                $data = $this->data;
                unset($data['Sms']['id']);
                unset($this->id);
                $this->create();
                $this->set($data);
            }
        }
        
        $this->data['Sms']['next_schedule_gen'] = '0000-00-00 00:00:00';

        // Round time down to nearest minute
        $this->data['Sms']['time'] = strtotime(date('Y-m-d H:i:00', $this->data['Sms']['time']));

        // Convert time to MySQL DATETIME
        $this->data['Sms']['time'] = date('Y-m-d H:i:s', $this->data['Sms']['time']);

        // Spam check
        $this->data['Sms']['spam_alert'] = 0;
        $this->data['Sms']['spam_fail'] = 0;
        if ($this->looksLikeSpam($this->data['Sms']['content'])) {
            $this->data['Sms']['spam_alert'] = 1;
            ClassRegistry::init('Setting')->change('App_sendSpamNotifications', 1);
        }
        
        if ($this->data['Sms']['reminder'] == 1) {
            $this->data['Sms']['phone_number'] = Configure::read('User.phone_number');
            $this->data['Sms']['name'] = __('Remind Me To');
        }

        // Calculate cost
        $this->data['Sms']['cost'] = $this->calculateCost($this->data['Sms']);
        if ($this->data['Sms']['cost'] === false) return false;
        
        return parent::beforeSave($options);
    }
    
    public function afterSave($created) {
        if ($this->autoCreated) {
            $this->autoCreated = false;
            $this->id = $this->getInsertID();
        }
        
        $repeats = false;
        $spent = 1;
        
        // Delete unsent schedules for this message
        $this->Schedule->deleteAll(array(
            'Schedule.sms_id' => $this->autoCreateNewSms === false ? $this->id : $this->autoCreateNewSms,
            'Schedule.status' => array(
                'scheduled',
                'no_credit',
                'spam_alert'
            )
        ));
        
        // Create initial Schedule
        $lastSchedule = strtotime($this->data['Sms']['time']);
        $this->createSchedule($this->id, date('Y-m-d H:i:s', $lastSchedule), $this->User->getCredits($this->data['Sms']['user_id']) - $this->User->getAllocatedCredits($this->data['Sms']['user_id']) - $this->data['Sms']['cost'] < 0 ? 'no_credit' : '');
        if (!empty($this->data['Sms']['repeat_options']) && $this->data['Sms']['spam_alert'] != 1) {          
            $totalCredits = $this->User->getCredits($this->data['Sms']['user_id']) - $this->User->getAllocatedCredits($this->data['Sms']['user_id']);
            $canAfford = floor($totalCredits / $this->data['Sms']['cost']);
            
            // Create repeat Schedule(s)
            $repeat = json_decode($this->data['Sms']['repeat_options']);
            if (is_object($repeat)) {
                $excludeDates = array();
                if (!empty($schedule['Sms']['deleted_dates'])) {
                    $excludeDates = json_decode($schedule['Sms']['deleted_dates']);
                }
                
                if ($repeat->D == 1) { // Daily
                    $repeats = true;
                    for ($i = 1; $i <= Configure::read('Settings.App_scheduleDays'); $i++) {
                        $newTime = strtotime($this->data['Sms']['time'].' + '.$i.' days');
                        if (!in_array($newTime, $excludeDates)) {
                            if ($spent <= $canAfford && ($repeat->WD == 0 || date('N', $newTime) < 6)) {
                                $lastSchedule = $newTime;
                                $this->createSchedule($this->id, date('Y-m-d H:i:s', $newTime));
                                $spent++;
                            }
                        }
                    }
                } else if ($repeat->W == 1) { // Weekly
                    $repeats = true;
                    for ($i = 1; $i <= Configure::read('Settings.App_scheduleDays'); $i++) {
                        $newTime = strtotime($this->data['Sms']['time'].' + '.$i.' days');
                        if (!in_array($newTime, $excludeDates) && $i % 7 == 0) {
                            if ($spent <= $canAfford && ($repeat->WD == 0 || date('N', $newTime) < 6)) {
                                $lastSchedule = $newTime;
                                $this->createSchedule($this->id, date('Y-m-d H:i:s', $newTime));
                                $spent++;
                            }
                        }
                    }
                } else if ($repeat->M == 1) { // Monthly
                    $repeats = true;
                    for ($i = 1; $i <= Configure::read('Settings.App_scheduleDays'); $i++) {
                        $startTime = strtotime($this->data['Sms']['time']);
                        $newTime = strtotime($this->data['Sms']['time'].' + '.$i.' days');
                        if (!in_array($newTime, $excludeDates) && date('d', $startTime) == date('d', $newTime)) {
                            if ($spent <= $canAfford && ($repeat->WD == 0 || date('N', $newTime) < 6)) {
                                $lastSchedule = $newTime;
                                $this->createSchedule($this->id, date('Y-m-d H:i:s', $newTime));
                                $spent++;
                            }
                        }
                    }
                } else if ($repeat->Y == 1) { // Yearly
                    $repeats = true;
                    for ($i = 1; $i <= Configure::read('Settings.App_scheduleDays'); $i++) {
                        $startTime = strtotime($this->data['Sms']['time']);
                        $newTime = strtotime($this->data['Sms']['time'].' + '.$i.' days');
                        if (!in_array($newTime, $excludeDates) && date('d', $startTime) == date('d', $newTime) && date('m', $startTime) == date('m', $newTime)) {
                            if ($spent <= $canAfford && ($repeat->WD == 0 || date('N', $newTime) < 6)) {
                                $lastSchedule = $newTime;
                                $this->createSchedule($this->id, date('Y-m-d H:i:s', $newTime));
                                $spent++;
                            }
                        }
                    }
                }
            }

            // Set date for next Schedule generation if message is to repeat
            $nextScheduleDate = '';
            if ($repeats) {
                $nextScheduleDate = date('Y-m-d H:i:s', strtotime(date('Y-m-d H:i:s', $lastSchedule).' - 2 days'));
            }
            $this->query('UPDATE `sms` SET `next_schedule_gen` = "'.$nextScheduleDate.'" WHERE `id` = "'.(isset($this->id) ? $this->id : $this->data['Sms']['id']).'";');
        }
        
        return parent::afterSave($created);
    }
    
    /**
     * Return true if Sms has Schedules that have been sent
     * @param string $smsId
     * @return boolean 
     */
    public function hasSentSchedules($smsId) {
        return $this->Schedule->find('count', array(
            'conditions' => array(
                'Schedule.sms_id' => $smsId,
                'Schedule.status' => array(
                    'delivered',
                    'delivered_errors',
                    'failed',
                    'pending'
                )
            )
        )) > 0;
    }
    
    /**
     * Create schedule row for a message at a specific time (Schedule are what the sender script processes)
     * @param string $smsId
     * @param string $time 
     */
    public function createSchedule($smsId, $time, $status = '') {
        $this->Schedule->create();
        $this->Schedule->save(array(
            'sms_id' => $smsId,
            'send_time' => $time,
            'sms_content' => $this->data['Sms']['content'],
            'sms_spam_alert' => isset($this->data['Sms']['spam_alert']) ? $this->data['Sms']['spam_alert'] : 0,
            'sms_cost' => $this->data['Sms']['cost'],
            'sms_user_id' => $this->data['Sms']['user_id']
        ));
        
        if (!empty($status)) {
            $this->Schedule->status($this->Schedule->getInsertID(), $status);
        }
    }
    
    /**
     * Calculate cost of SMS every time it is sent to all recipients
     * @return int
     */
    public function calculateCost($data = array()) {
        $collection = new ComponentCollection();
        $controller = new Controller();
        $this->Message = new MessageComponent($collection);
        $this->Message->initialize($controller);
        
        $res = $this->Message->sms(
            __('Cost Calculation'),
            explode(',', $data['recipient']),
            'sms',
            array('content' => $data['content']),
            '',
            true
        );
        $cost = 0;
        if (isset($res->CreditsRequired)) {
            $cost = $res->CreditsRequired;
        }
        return $cost;
    }
    
    /**
     * Return stored cost of SMS
     * @param string $smsId
     * @return int|boolean 
     */
    public function getCost($smsId) {
        $res = $this->find('first', array(
            'conditions' => array(
                'Sms.id' => $smsId
            ),
            'fields' => array(
                'Sms.cost'
            )
        ));
        if (!empty($res)) return $res['Sms']['cost'];
        return false;
    }
    
    /**
     * Retrieve scheduled messages for user
     * @param string $userId
     * @return array 
     */
    public function retrieveScheduled($userId) {
        $res = $this->Schedule->find('all', array(
            'fields' => array(
                'Schedule.send_time',
                'Sms.id',
                'Sms.name',
                'Sms.content',
                'Sms.recipient',
                'Sms.recipient_user',
                'Sms.repeat_options',
                'Schedule.status',
                'Schedule.id'
            ),
            'conditions' => array(
                'Sms.user_id' => $userId,
                'Schedule.status' => array(
                    'scheduled',
                    'no_credit',
                    'spam_alert'
                )
            )
        ));
        
        foreach ($res as &$row) {
            $row['Schedule']['send_time'] = strtotime($row['Schedule']['send_time'].' UTC');
            $row['Schedule']['status_colour'] = $this->statuses[$row['Schedule']['status']]['colour'];
            $row['Schedule']['status_text'] = $this->statuses[$row['Schedule']['status']]['text'];
        }
        return $res;
    }
    
    /**
     * Retrieve sent messages for user
     * @param string $userId
     * @return array 
     */
    public function retrieveSent($userId) {
        $res = $this->Schedule->find('all', array(
            'fields' => array(
                'Schedule.send_time',
                'Sms.id',
                'Sms.name',
                'Sms.content',
                'Sms.recipient',
                'Sms.recipient_user',
                'Sms.repeat_options',
                'Schedule.status',
                'Schedule.id'
            ),
            'conditions' => array(
                'Sms.user_id' => $userId,
                'Schedule.status' => array(
                    'spam_fail',
                    'delivered',
                    'delivered_errors',
                    'failed',
                    'pending'
                )
            ),
            'order' => 'Schedule.send_time DESC, Schedule.status DESC'
        ));
        
        foreach ($res as &$row) {
            $row['Schedule']['send_time'] = strtotime($row['Schedule']['send_time'].' UTC');
            $row['Schedule']['status_colour'] = $this->statuses[$row['Schedule']['status']]['colour'];
            $row['Schedule']['status_text'] = $this->statuses[$row['Schedule']['status']]['text'];
        }
        return $res;
    }
    
    /**
     * Return all SMS scheduled for sending now and flag them as processing
     * @return array 
     */
    public function getReadyToSend() {
        $return = array();
        $conditions = array(
            'Schedule.send_time <= "'.date('Y-m-d H:i:00').'"',
            'Schedule.processing' => 0,
            'Schedule.done' => 0,
            'Schedule.status' => 'scheduled'
        );
        $res = $this->Schedule->find('all', array(
            'conditions' => $conditions,
            'fields' => array(
                'Schedule.id',
                'Schedule.sms_id'
            )
        ));
        
        // Flag as processing
        $this->Schedule->updateAll(array(
            'Schedule.processing' => 1
        ), array(
            'Schedule.id' => Set::extract('/Schedule/id', $res)
        ));
        
        // Fetch SMS for each schedule
        $this->Behaviors->load('Containable');
        foreach ($res as $row) {
            $sms = $this->find('first', array(
                'conditions' => array(
                    'Sms.id' => $row['Schedule']['sms_id']
                ),
                'fields' => array(
                    'Sms.id',
                    'Sms.recipient',
                    'Sms.content',
                    'Sms.reminder',
                    'Sms.cost',
                    'User.phone_number',
                    'User.country'
                ),
                'contain' => array(
                    'User'
                )
            ));
            $sms['Schedule']['id'] = $row['Schedule']['id'];
            array_push($return, $sms);
        }
        return $return;
    }
    
    /**
     * Return Schedule data
     * @param string $smsId
     * @param string $scheduleId
     * @return array
     */
    public function getSms($smsId, $scheduleId) {
        $res = $this->Schedule->findById($scheduleId);
        if (!empty($res)) {
            $res['Sms']['time_unix'] = strtotime($res['Sms']['time']);
            $res['Schedule']['send_time'] = strtotime($res['Schedule']['send_time'].' UTC');
            $res['Schedule']['status_colour'] = $this->statuses[$res['Schedule']['status']]['colour'];
            $res['Schedule']['status_text'] = $this->statuses[$res['Schedule']['status']]['text'];
        }
        return $res;
    }
    
    /**
     * Flag a message as spam
     * @param string $smsId
     * @param boolean $spam 
     */
    public function spam($smsId, $spam = true) {
        $res = $this->Schedule->getSchedules($smsId);
        if ($spam) {
            // Delete all schedules except first
            if (count($res) > 1) {
                for ($i = 1; $i < count($res); $i++) {
                    $deleteStatuses = array(
                        'scheduled',
                        'no_credit',
                        'spam_alert'
                    );
                    if (in_array($res[$i]['Schedule']['status'], $deleteStatuses)) {
                        if ($res[$i]['Schedule']['processing'] == 0 && $res[$i]['Schedule']['done'] == 0) {
                            $this->Schedule->delete($res[$i]['Schedule']['id']);
                        }
                    }
                }
            }

            // Flag first schedule status
            $this->Schedule->status($res[0]['Schedule']['id'], 'spam_fail');
        } else {
            // Unflag all schedules
            foreach ($res as $schedule) {
                $this->Schedule->status($schedule['Schedule']['id'], 'scheduled');
            }
        }
        
        // Flag/unflag message
        $this->id = $smsId;
        $this->saveField('spam_alert', $spam);
        $this->id = $smsId;
        $this->saveField('spam_fail', $spam);
    }
    
    /**
     * Return true if a message looks spammy
     * @param string $content
     * @return boolean 
     */
    public function looksLikeSpam($content = '') {
        $maxScore = Configure::read('Settings.App_spamScore');
        $currScore = 0;
        $spamWords = ClassRegistry::init('Spam')->find('list');
        $content = strtolower($content);
        
        foreach ($spamWords as $word) {
            if (strpos($content, $word) !== false) $currScore += substr_count($content, $word);
        }
        
        if ($currScore < $maxScore || $maxScore <= 0) return false;
        return true;
    }
    
    /**
     * Return last Schedule date for an SMS or false if not found
     * @param string $smsId 
     * @param boolean $sentOnly
     * @return string|boolean
     */
    public function getLastScheduleDate($smsId, $sentOnly = false) {
        $conditions = array(
            'Schedule.sms_id' => $smsId
        );
        if (!$sentOnly) {
            $conditions['Schedule.status'] = array(
                'scheduled',
                'spam_alert',
                'no_credit'
            );
        } else {
            $conditions['Schedule.status'] = array(
                'spam_fail',
                'delivered',
                'delivered_errors',
                'failed',
                'pending'
            );
        }
        
        $res = $this->Schedule->find('first', array(
            'conditions' => $conditions,
            'fields' => array(
                'Schedule.send_time'
            ),
            'order' => 'Schedule.send_time DESC'
        ));
        if (!empty($res)) return $res['Schedule']['send_time'];
        return false;
    }
    
    /**
     * Return number of schedules
     * @param string $smsId 
     * @return int
     */
    public function countSchedules($smsId) {
        return $this->Schedule->find('count', array(
            'conditions' => array(
                'Schedule.sms_id' => $smsId,
                'NOT' => array(
                    'Schedule.status' => 'no_credit'
                )
            )
        ));
    }
    
    /**
     * Return spam messages to send soon
     * @return array
     */
    public function getSpamSendSoon() {
        $res = array();
        $res['sms'] = $this->Schedule->find('all', array(
            'conditions' => array(
                'Schedule.status' => 'spam_alert',
                'Schedule.send_time <=' => date('Y-m-d H:i:s', strtotime(date('Y-m-d H:i:s').' + '.Configure::read('Settings.App_spamSmsDays').' days')),
            )
        ));
        $res['email'] = $this->Schedule->find('all', array(
            'conditions' => array(
                'Schedule.status' => 'spam_alert',
                'Schedule.send_time >' => date('Y-m-d H:i:s', strtotime(date('Y-m-d H:i:s').' + '.Configure::read('Settings.App_spamSmsDays').' days')),
                'Schedule.send_time <=' => date('Y-m-d H:i:s', strtotime(date('Y-m-d H:i:s').' + '.Configure::read('Settings.App_spamEmailDays').' days')),
            )
        ));
        return $res;
    }
    
    /**
     * Return messages that need schedules generating
     */
    public function needSchedulesGenerating() {
        $tmp = $this->Schedule->find('all', array(
            'conditions' => array(
                'NOT' => array(
                    'Schedule.status' => array(
                        'spam_fail',
                        'no_credit'
                    )
                ),
                'Sms.next_schedule_gen <= ' => date('Y-m-d H:i:s'),
                'Sms.next_schedule_gen != ' => '0000-00-00 00:00:00',
            ),
            'order' => 'Schedule.send_time DESC'
        ));
        $res = array();
        $ids = array();
        foreach ($tmp as $row) {
            if (!in_array($row['Sms']['id'], $ids)) {
                array_push($res, $row);
                array_push($ids, $row['Sms']['id']);
            }
        }
        return $res;
    }
    
    /**
     * Returns whether repeat message that user doesn't have full credit for has been flagged as no_credit
     * @param $smsId
     * @return boolean
     */
    public function alreadyScheduledNoCredit($smsId) {
        return $this->Schedule->find('count', array(
            'conditions' => array(
                'Schedule.sms_id' => $smsId,
                'Schedule.status' => 'no_credit'
            ),
            'recursive' => -1
        )) > 0;
    }
    
    public function getStatusDescription($status) {
        $res = '';
        if (isset($this->statuses[$status]['description'])) $res = $this->statuses[$status]['description'];
        return $res;
    }
    
}
