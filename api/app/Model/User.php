<?php
App::uses('Model', 'Model');
App::import('Component', 'Auth');

class User extends AppModel {
    
    public $hasMany = array('Sms', 'Billing');
    
    public $validate = array(
        'phone_number' => array(
            'minLength' => array(
                'rule' => array('minLength', 1),
                'required' => true,
                'allowEmpty' => false,
                'last' => true
            ),
            'validNumbers' => array(
                'rule' => array('validPhoneNumbers'),
                'last' => true,
                'required' => true
            )
        ),
        'password' => array(
            'minLength' => array(
                'rule' => array('minLength', 1),
                'required' => true,
                'allowEmpty' => false
            )
        ),
        'country' => array(
            'minLength' => array(
                'rule' => array('minLength', 1),
                'required' => true,
                'allowEmpty' => false,
                'last' => true
            ),
            'validCountry' => array(
                'rule' => array('validCountry'),
                'required' => true
            )
        )
    );
    
    /**
     * Checks if number is in a valid format
     * @param array $check
     * @return boolean
     */
    public function validPhoneNumbers($check) {
        $number = $check['phone_number'];
        $this->InternationalNumber = ClassRegistry::init('InternationalNumber');
        $res = $this->InternationalNumber->findByCountryNameCode($this->data[$this->alias]['country']);
        
        if (empty($res)) {
            return false;
        } else if (preg_match('/^\+?\d+$/', $number) != 1 || strlen($number) < 11 || strlen($number) > 16) { // All digits (or +) and 11-16 characters
            return false;
        } else if ($res['InternationalNumber']['available'] != '1') { // Check country available for registration
            return false;
        } else if ($this->InternationalNumber->validCountryCode($number, $this->data[$this->alias]['country']) === false) { // Invalid/unsupported country code
            return false;
        }
        
        $this->data[$this->alias]['phone_number'] = $number;
        return true;
    }
    
    /**
     * Validate country code
     * @param array $check 
     * @return boolean 
     */
    public function validCountry($check) {
        return ClassRegistry::init('InternationalNumber')->validCountry($check['country']);
    }
    
    public function beforeValidate($options = array()) {
        // Set validation messages
        $this->validate['phone_number']['minLength']['message'] = __('Please enter your phone number.');
        $this->validate['phone_number']['validNumbers']['message'] = __('Your phone number is invalid.');
        $this->validate['password']['minLength']['message'] = __('Please enter your password.');
        $this->validate['country']['minLength']['message'] = __('Please enter your country.');
        $this->validate['country']['validCountry']['message'] = __('Your country is invalid.');
        
        return parent::beforeValidate($options);
    }
    
    public function beforeSave($options = array()) {
        // If creating
        if (!$this->id && !isset($this->data[$this->alias][$this->primaryKey])) {
            // Set defaults
            $this->data['User']['active'] = 0;
            $this->data['User']['remaining_credit'] = Configure::read('Settings.App_freeCredits');
            $this->data['User']['verification_pin'] = '';
            $this->data['User']['report_invalid_format'] = 0;
        }
        
        // Hash password
        if (isset($this->data['User']['password'])) {
            $this->data['User']['password'] = AuthComponent::password($this->data['User']['password']);
        }
        
        // Capitalise country code
        if (isset($this->data['User']['country'])) {
            $this->data['User']['country'] = strtoupper($this->data['User']['country']);
        }
        
        return parent::beforeSave($options);
    }
    
    /**
     * Update scheduled/no_credit Schedule statuses from the soonest first
     * @param type $userId 
     */
    public function updateNoCreditStatuses($userId) { 
        $sms = $this->Sms->findAllByUserId($userId);
        $smsIds = Set::extract('{n}/Sms/id', $sms);
        
        // Retrieve schedules that could be updated
        $schedules = $this->Sms->Schedule->find('all', array(
            'conditions' => array(
                'Schedule.sms_id' => $smsIds,
                'Schedule.status' => array(
                    'scheduled',
                    'no_credit'
                ),
                'Schedule.processing' => 0,
                'Schedule.done' => 0
            )
        ));
        
        if (!empty($schedules)) {
            $this->Sms->Schedule->deleteAll(array(
                'Schedule.sms_id' => $smsIds,
                'Schedule.status' => array(
                    'scheduled',
                    'no_credit'
                ),
                'Schedule.processing' => 0,
                'Schedule.done' => 0
            ));

            // Get total number of allocated credits (we need this because the above find call doesn't include spam_alert schedules)
            $remaining = $this->getCredits($userId) - $this->getAllocatedCredits($userId);
            $startNewSchedule = array();
            foreach ($schedules as $schedule) {
                if (strlen($schedule['Sms']['reminder']) < 1) $schedule['Sms']['reminder'] = 0;
                $this->Sms->set($schedule);

                if ($remaining >= $schedule['Sms']['cost']) {
                    $remaining -= $schedule['Sms']['cost'];
                    $startNewSchedule[$schedule['Sms']['id']] = $schedule['Schedule']['send_time'];
                    $this->Sms->createSchedule($schedule['Sms']['id'], $schedule['Schedule']['send_time'], 'scheduled');
                } else {
                    $startNewSchedule[$schedule['Sms']['id']] = $schedule['Schedule']['send_time'];
                    $this->Sms->createSchedule($schedule['Sms']['id'], $schedule['Schedule']['send_time'], 'no_credit');
                }
            }
            if ($remaining > 0) {
                $newSchedules = array();

                // List dates for sms ID + send time (soonest first) until we have $remaining. Create schedules from list and include an extra no_credit schedule if necessary
                if (!empty($sms)) {
                    $excludeDates = array();
                    if (!empty($schedule['Sms']['deleted_dates'])) {
                        $excludeDates = json_decode($schedule['Sms']['deleted_dates']);
                    }
                    
                    $newSchedules = array();
                    $createNoCredit = array();
                    foreach ($sms as $message) {
                        $repeats = false;
                        $repeat = json_decode($message['Sms']['repeat_options']);
                        $addedSchedules = 0;
                        $lastSchedule = '';
                        if (is_object($repeat)) {
                            if ($repeat->D == 1) { // Daily
                                $repeats = true;
                                for ($i = 1; $i <= Configure::read('Settings.App_scheduleDays'); $i++) {
                                    if ($addedSchedules >= $remaining) break;
                                    $newTime = strtotime($startNewSchedule[$message['Sms']['id']].' + '.$i.' days');
                                    if ($newTime > strtotime(date('Y-m-d H:i:s').' + '.Configure::read('Settings.App_scheduleDays').' days')) break;
                                    if (!in_array($newTime, $excludeDates) && ($repeat->WD == 0 || date('N', $newTime)) < 6) {
                                        $lastSchedule = $newTime;
                                        $message['Schedule']['send_time'] = date('Y-m-d H:i:s', $newTime);
                                        array_push($newSchedules, $message);
                                        $addedSchedules++;
                                    }
                                }
                            } else if ($repeat->W == 1) { // Weekly
                                $repeats = true;
                                for ($i = 1; $i <= Configure::read('Settings.App_scheduleDays'); $i++) {
                                    if ($addedSchedules >= $remaining) break;
                                    $newTime = strtotime($startNewSchedule[$message['Sms']['id']].' + '.$i.' days');
                                    if ($newTime > strtotime(date('Y-m-d H:i:s').' + '.Configure::read('Settings.App_scheduleDays').' days')) break;
                                    if (!in_array($newTime, $excludeDates) && $i % 7 == 0) {
                                        if ($repeat->WD == 0 || date('N', $newTime) < 6) {
                                            $lastSchedule = $newTime;
                                            $message['Schedule']['send_time'] = date('Y-m-d H:i:s', $newTime);
                                            array_push($newSchedules, $message);
                                            $addedSchedules++;
                                        }
                                    }
                                }
                            } else if ($repeat->M == 1) { // Monthly
                                $repeats = true;
                                for ($i = 1; $i <= Configure::read('Settings.App_scheduleDays'); $i++) {
                                    if ($addedSchedules >= $remaining) break;
                                    $startTime = strtotime($startNewSchedule[$message['Sms']['id']]);
                                    $newTime = strtotime($startNewSchedule[$message['Sms']['id']].' + '.$i.' days');
                                    if ($newTime > strtotime(date('Y-m-d H:i:s').' + '.Configure::read('Settings.App_scheduleDays').' days')) break;
                                    if (!in_array($newTime, $excludeDates) && date('d', $startTime) == date('d', $newTime)) {
                                        if ($repeat->WD == 0 || date('N', $newTime) < 6) {
                                            $lastSchedule = $newTime;
                                            $message['Schedule']['send_time'] = date('Y-m-d H:i:s', $newTime);
                                            array_push($newSchedules, $message);
                                            $addedSchedules++;
                                        }
                                    }
                                }
                            } else if ($repeat->Y == 1) { // Yearly
                                $repeats = true;
                                for ($i = 1; $i <= Configure::read('Settings.App_scheduleDays'); $i++) {
                                    if ($addedSchedules >= $remaining) break;
                                    $startTime = strtotime($startNewSchedule[$message['Sms']['id']]);
                                    $newTime = strtotime($startNewSchedule[$message['Sms']['id']].' + '.$i.' days');
                                    if ($newTime > strtotime(date('Y-m-d H:i:s').' + '.Configure::read('Settings.App_scheduleDays').' days')) break;
                                    if (!in_array($newTime, $excludeDates) && date('d', $startTime) == date('d', $newTime) && date('m', $startTime) == date('m', $newTime)) {
                                        if ($repeat->WD == 0 || date('N', $newTime) < 6) {
                                            $lastSchedule = $newTime;
                                            $message['Schedule']['send_time'] = date('Y-m-d H:i:s', $newTime);
                                            array_push($newSchedules, $message);
                                            $addedSchedules++;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    $times = Set::extract('{n}/Schedule/send_time', $newSchedules);
                    foreach ($times as &$time) {
                        $time = strtotime($time);
                    }
                    asort($times, SORT_NUMERIC);

                    $tmp = array();
                    $l = 0;
                    foreach ($times as $k => $time) {
                        if ($l++ >= $remaining) break;
                        array_push($tmp, $newSchedules[$k]);
                    }
                    $fullNewSchedules = $newSchedules;
                    $newSchedules = $tmp;

                    $noCreditsToCreate = array();
                    if (!empty($newSchedules)) {
                        foreach ($newSchedules as $newSchedule) {
                            $this->Sms->createSchedule($newSchedule['Sms']['id'], $newSchedule['Schedule']['send_time']);

                            // Set date for next Schedule generation if message is to repeat
                            $nextScheduleDate = '';
                            if ($repeats) {
                                $nextScheduleDate = date('Y-m-d H:i:s', strtotime($newSchedule['Schedule']['send_time'].' - 2 days'));
                            }
                            $this->query('UPDATE `sms` SET `next_schedule_gen` = "'.$nextScheduleDate.'" WHERE `id` = "'.$newSchedule['Sms']['id'].'";');
                        }
                    }
                    if (!empty($fullNewSchedules)) {
                        $doneSms = array();
                        foreach ($fullNewSchedules as $newSchedule) {
                            // Create additional no_credit statuses for repeats that can't continue
                            if (!in_array($newSchedule['Sms']['id'], $doneSms)) {
                                $repeat = json_decode($newSchedule['Sms']['repeat_options']);
                                $dateTxt = '';
                                if (is_object($repeat)) {
                                    if ($repeat->D == 1) {
                                        $dateTxt = 'days';
                                    } else if ($repeat->W == 1) {
                                        $dateTxt = 'weeks';
                                    } else if ($repeat->M == 1) {
                                        $dateTxt = 'months';
                                    } else if ($repeat->Y == 1) {
                                        $dateTxt = 'years';
                                    }
                                    if (!empty($dateTxt)) {
                                        $noCreditDate = strtotime($this->Sms->getLastScheduleDate($newSchedule['Sms']['id']).' + 1 '.$dateTxt);
                                        if ($noCreditDate <= strtotime(date('Y-m-d H:i:s').' + '.Configure::read('Settings.App_scheduleDays').' days')) {
                                            $this->Sms->createSchedule($newSchedule['Sms']['id'], date('Y-m-d H:i:s', $noCreditDate), 'no_credit');
                                        }
                                    }
                                    array_push($doneSms, $newSchedule['Sms']['id']);
                                }
                            }
                        }
                    }
                }
            } else {
                foreach ($sms as $message) {
                    $doneSms = array();
                    // Create additional no_credit statuses for repeats that can't continue
                    if (!in_array($message['Sms']['id'], $doneSms)) {
                        $repeat = json_decode($message['Sms']['repeat_options']);
                        $dateTxt = '';
                        if (is_object($repeat)) {
                            if ($repeat->D == 1) {
                                $dateTxt = 'days';
                            } else if ($repeat->W == 1) {
                                $dateTxt = 'weeks';
                            } else if ($repeat->M == 1) {
                                $dateTxt = 'months';
                            } else if ($repeat->Y == 1) {
                                $dateTxt = 'years';
                            }
                            if (!empty($dateTxt)) {
                                $noCreditDate = strtotime($this->Sms->getLastScheduleDate($message['Sms']['id']).' + 1 '.$dateTxt);
                                if ($noCreditDate <= strtotime(date('Y-m-d H:i:s').' + '.Configure::read('Settings.App_scheduleDays').' days')) {
                                    $this->Sms->createSchedule($message['Sms']['id'], date('Y-m-d H:i:s', $noCreditDate), 'no_credit');
                                }
                            }
                            array_push($doneSms, $message['Sms']['id']);
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Returns user ID if already registered and inactive
     * Returns empty string if not registered
     * Return false if registered and active or on failure
     * @param array $data 
     * @return boolean|string
     */
    public function allowedToRegister($data = array()) {
        if (isset($data['phone_number']) && isset($data['country'])) {
            $this->formatNumbers($data['phone_number'], $data['country']);
            $res = $this->find('first', array(
                'conditions' => array(
                    'User.phone_number' => $data['phone_number'],
                    'User.active != ' => 1
                ),
                'recursive' => -1
            ));
            if (!empty($res)) return $res['User']['id'];
            
            $res = $this->find('first', array(
                'conditions' => array(
                    'User.phone_number' => $data['phone_number'],
                    'User.active' => 1
                ),
                'recursive' => -1
            ));
            if (empty($res)) return '';
        }
        return false;
    }
    
    /**
     * Generate and set verification PIN for user
     * @param string $user 
     * @return int
     */
    public function generatePin($user = '') {
        $pin = rand(1000, 9999);
        $this->id = $user;
        $this->saveField('verification_pin', $pin);
        
        return $pin;
    }
    
    /**
     * Return true if ID and verification PIN match up
     * @param array $data
     * @return bool
     */
    public function validPin($data = array()) {
        if (isset($data['country']) && isset($data['phone_number']) && isset($data['pin'])) {
            $this->formatNumbers($data['phone_number'], $data['country']);
            return $this->find('count', array(
                'conditions' => array(
                    'phone_number' => $data['phone_number'],
                    'verification_pin' => $data['pin']
                ),
                'recursive' => -1
            )) > 0;
        }
        return false;
    }
    
    /**
     * Activate user account
     * @param array $data 
     */
    public function activateUser($data = array()) {
        if (isset($data['phone_number']) && !empty($data['phone_number'])) {
            $this->formatNumbers($data['phone_number'], $data['country']);
            $this->updateAll(array(
                'active' => 1,
                'verification_pin' => '""'
            ), array(
                'phone_number' => $data['phone_number']
            ));
            return true;
        }
        return false;
    }
    
    /**
     * Change password
     * @param array $data 
     */
    public function changePassword($data = array()) {
        if (isset($data['phone_number']) && isset($data['password']) && !empty($data['phone_number']) && !empty($data['password'])) {
            $this->formatNumbers($data['phone_number'], $data['country']);
            $this->updateAll(array(
                'password' => '\''.AuthComponent::password($data['password']).'\'',
                'verification_pin' => '""'
            ), array(
                'phone_number' => $data['phone_number']
            ));
            return true;
        }
        return false;
    }
    
    /**
     * Get user ID when given phone number
     * @param array $data
     * @return array|false
     */
    public function getIdFromPhone($data = array()) {
        $res = array();
        if (isset($data['phone_number']) && isset($data['country']) && !empty($data['phone_number'])) {
            $this->formatNumbers($data['phone_number'], $data['country']);
            $res = $this->find('first', array(
                'conditions' => array(
                    'User.phone_number' => $data['phone_number']
                )
            ));
        }
        
        return !empty($res) ? $res['User']['id'] : false;
    }
    
    /**
     * Get phone number when given user ID
     * @param string $userId
     * @return string|false
     */
    public function getPhoneFromID($userId = array()) {
        $res = array();
        if (!empty($userId)) {
            $res = $this->find('first', array(
                'conditions' => array(
                    'User.id' => $userId
                ),
                'fields' => array(
                    'User.phone_number'
                )
            ));
        }
        
        return !empty($res) ? $res['User']['phone_number'] : false;
    }
    
    /**
     * Get country when given user ID
     * @param string $userId
     * @return string|false
     */
    public function getCountryFromID($userId = array()) {
        $res = array();
        if (!empty($userId)) {
            $res = $this->find('first', array(
                'conditions' => array(
                    'User.id' => $userId
                ),
                'fields' => array(
                    'User.country'
                )
            ));
        }
        
        return !empty($res) ? $res['User']['country'] : false;
    }
    
    /**
     * Return user details
     * @param string $userId
     * @return array 
     */
    public function getDetails($userId) {
        $res = $this->find('first', array(
            'conditions' => array(
                'User.id' => $userId
            ),
            'fields' => array(
                'User.phone_number',
                'User.remaining_credit'
            )
        ));
        if (isset($res['User'])) {
            $res = $res['User'];
        }
        return $res;
    }
    
    /**
     * Return credits for user
     * @param string $userId
     * @return float 
     */
    public function getCredits($userId) {
        $res = $this->find('first', array(
            'conditions' => array(
                'User.id' => $userId
            ),
            'fields' => array(
                'User.remaining_credit'
            )
        ));
        
        if (!empty($res)) {
            return $res['User']['remaining_credit'];
        }
        return 0;
    }
    
    /**
     * Return allocated credits for schedules ready to send
     * @param string $userId 
     * @return float
     */
    public function getAllocatedCredits($userId) {
        $sms = $this->Sms->findAllByUserId($userId);
        $sms = Set::extract('{n}/Sms/id', $sms);
        
        $costs = $this->Sms->Schedule->find('all', array(
            'fields' => 'Sms.cost',
            'conditions' => array(
                'Schedule.sms_id' => $sms,
                'Schedule.status' => array(
                    'scheduled',
                    'spam_alert',
                    'no_credit'
                )
            )
        ));
        $costs = Set::extract('{n}/Sms/cost', $costs);
        $total = 0;
        foreach ($costs as $cost) {
            $total += $cost;
        }
        return $total;
    }
    
    /**
     * Deduct credits from user
     * @param string $userId
     * @param float $credits
     */
    public function deductCredits($userId, $credits = 0) {
        $current = $this->getCredits($userId);
        
        if (!empty($current)) {
            $current -= $credits;
            $this->id = $userId;
            $this->saveField('remaining_credit', $current);
        }
    }
    
    /**
     * Increase user's credits
     * @param string $userId
     * @param float $credits
     */
    public function increaseCredits($userId, $credits = 0) {
        $current = $this->getCredits($userId);
        
        if (!empty($current)) {
            $current += $credits;
            $this->id = $userId;
            $this->saveField('remaining_credit', $current);
        }
    }
    
    /**
     * Return true if user has enough credits for message
     * @param array $data
     * @return boolean
     */
    public function enoughCredits($data = array()) {
        if (isset($data['Sms'])) $data = $data['Sms'];
        if (isset($data['user_id'])) {
            $cost = $this->Sms->calculateCost($data);
            if ($cost === false) return false;
            $credits = $this->getCredits($data['user_id']);
            if ($credits >= $cost) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Validates user credentials and returns the number to specify as username in subsequent API calls along with user's exit code
     * @param array $data
     * @return array|false 
     */
    public function validUser($data) {
        if (isset($data['phone_number']) && isset($data['password']) && isset($data['country']) && !empty($data['phone_number']) && !empty($data['password']) && !empty($data['country'])) {
            $this->formatNumbers($data['phone_number'], $data['country']);
            
            $res = $this->find('first', array(
                'conditions' => array(
                    'User.phone_number' => $data['phone_number'],
                    'User.password' => AuthComponent::password($data['password']),
                    'User.active' => 1
                ),
                'recursive' => -1
            ));
            if (!empty($res)) {
                return array(
                    'phone_number' => $data['phone_number'],
                    'exit_code' => ClassRegistry::init('InternationalNumber')->getExitCodeByCountry($data['country'])
                );
            }
        }
        return false;
    }
    
    /**
     * Validates user login details
     * @param array $data
     * @return array|false 
     */
    public function loginUser($data) {
        if (isset($data['phone_number']) && isset($data['password']) && !empty($data['phone_number']) && !empty($data['password'])) {
            $res = $this->find('first', array(
                'conditions' => array(
                    'User.phone_number' => $data['phone_number'],
                    'User.password' => AuthComponent::password($data['password']),
                    'User.active' => 1
                )
            ));
            if (!empty($res)) return $res['User'];
        }
        return false;
    }
    
    /**
     * Returns whether a number has already been reported as having invalid formatting
     * @param array $data 
     * @return boolean
     */
    public function alreadyReportedInvalid($data) {
        return $this->find('count', array(
            'conditions' => array(
                'User.id' => $this->getIdFromPhone($data),
                'User.report_invalid_format' => 1
            ),
            'recursive' => -1
        )) > 0;
    }
    
    /**
     * Sets a number as having been reported as having invalid formatting
     * @param array $data 
     */
    public function reportInvalid($data) {
        $this->id = $this->getIdFromPhone($data);
        $this->saveField('report_invalid_format', 1);
    }
    
    /**
     * Return balance, allocated and remaining credits for user
     * @param string $userId
     * @return array|boolean 
     */
    public function getAllCredits($userId) {
        $res = $this->find('first', array(
            'conditions' => array(
                'User.id' => $userId
            ),
            'fields' => array(
                'User.remaining_credit'
            )
        ));
        if (!empty($res)) {
            $res = array(
                'balance' => $res['User']['remaining_credit'],
                'allocated' => $this->getAllocatedCredits($userId)
            );
            $res['remaining'] = $res['balance'] - $res['allocated'];
            foreach ($res as &$row) {
                $row = sprintf('%0.1f', $row);
            }
            return $res;
        }
        return false;
    }
    
    /**
     * Set user's account as not having to display spam fail notification
     * @param string $userId 
     */
    public function shownSpamFailNotification($userId) {
        $this->updateAll(array(
            'show_spam_fail_notification' => 0
        ), array(
            'User.id' => $userId
        ));
    }
    
}
