<?php
App::uses('AppModel', 'Model');
/**
 * Sms Model
 *
 * @property User $User
 */
class Sms extends AppModel {

/**
 * Display field
 *
 * @var string
 */
        public $useTable = 'sms';
	public $displayField = 'name';


	//The Associations below have been created with all possible keys, those that are not needed can be removed

/**
 * belongsTo associations
 *
 * @var array
 */
	public $belongsTo = array(
		'User' => array(
			'className' => 'User',
			'foreignKey' => 'user_id',
			'conditions' => '',
			'fields' => '',
			'order' => ''
		)
	);
        public $hasMany = array(
		'Schedule' => array(
			'className' => 'Schedule',
			'foreignKey' => 'sms_id',
			'dependent' => false,
			'conditions' => '',
			'fields' => '',
			'order' => '',
			'limit' => '',
			'offset' => '',
			'exclusive' => '',
			'finderQuery' => '',
			'counterQuery' => ''
		)
        );
        
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
}
