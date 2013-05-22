<?php
App::uses('Model', 'Model');

class Schedule extends AppModel {
    
    public $belongsTo = array('Sms');
    public $order = 'Schedule.send_time ASC, Schedule.status DESC';
    
    public function beforeSave($options = array()) {
        // If creating
        if (!$this->id && !isset($this->data[$this->alias][$this->primaryKey])) {
            // Set defaults
            $this->data[$this->alias]['status'] = 'scheduled';
        }
        
        // Spam check
        if (isset($this->data[$this->alias]['sms_spam_alert']) && $this->data[$this->alias]['sms_spam_alert'] == 1) {
            $this->data[$this->alias]['status'] = 'spam_alert';
        }
        
        return parent::beforeSave($options);
    }
    
    /**
     * Return send time for Schedule
     * @param string $scheduleId
     * @return string|boolean 
     */
    public function getTime($scheduleId) {
        $res = $this->find('first', array(
            'conditions' => array(
                'Schedule.id' => $scheduleId
            ),
            'fields' => array(
                'Schedule.send_time'
            )
        ));
        if (!empty($res)) return $res['Schedule']['send_time'];
        return false;
    }
    
    /**
     * Delete old schedule when editing a single schedule
     * @param string $scheduleId 
     */
    public function deleteOld($scheduleId) {
        $this->deleteAll(array(
            'Schedule.id' => $scheduleId,
            'Schedule.status' => array(
                'scheduled',
                'spam_alert',
                'no_credit'
            )
        ));
    }
    
    /**
     * Remove no credit schedule for and SMS
     * @param string $smsId 
     */
    public function removeNoCredit($smsId) {
        $this->deleteAll(array(
            'Schedule.status' => 'no_credit',
            'Schedule.sms_id' => $smsId
        ));
    }
    
    /**
     * Set message status
     * @param string $id
     * @param string $status 
     */
    public function status($id, $status) {
        $this->id = $id;
        $this->saveField('status', $status);
    }
    
    /**
     * Flags a schedule row as being in processing or not
     */
    public function processing($id, $value = 1) {
        $this->id = $id;
        $this->saveField('processing', $value);
    }
    
    /**
     * Flags a schedule row as being done or not
     */
    public function done($id, $value = 1) {
        $this->id = $id;
        $this->saveField('done', $value);
    }
    
    /**
     * Sets code used to verify that delivery receipts are genuine and returns it
     * @param string $id 
     * @return string 
     */
    public function verifyReceiptCode($id) {
        $res = String::uuid();
        $this->id = $id;
        $this->saveField('receipt', $res);
        return $res;
    }
    
    /**
     * Checks whether receipt code is valid for Schedule
     * @param string $id
     * @param string $receipt
     * @return boolean 
     */
    public function validReceipt($id, $receipt) {
        return $this->find('count', array(
            'conditions' => array(
                'Schedule.id' => $id,
                'Schedule.receipt' => $receipt
            ),
            'recursive' => -1
        )) > 0;
    }
    
    public function getSchedules($smsId) {
        return $this->findAllBySmsId($smsId);
    }
    
}
