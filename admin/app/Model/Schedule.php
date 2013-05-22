<?php
App::uses('AppModel', 'Model');
/**
 * Schedule Model
 *
 * @property Sms $Sms
 */

CakePlugin::load('Search');
class Schedule extends AppModel {
    
    public $actsAs = array('Search.Searchable');
    public $order = 'Schedule.send_time DESC';
    
    public $filterArgs = array(
        'phone_number' => array('type' => 'query', 'method' => 'senderSearch'),
        'recipient' => array('type' => 'query', 'method' => 'recipientSearch'),
        'send_time_start' => array('type' => 'expression', 'method' => 'makeRangeCondition', 'field' => 'Schedule.send_time BETWEEN ? AND ?'),
        'send_time_end' => array('type' => 'query', 'method' => ''),
        'status' => array('type' => 'value')
    );
    
    public function makeRangeCondition() {
        $res = array(
            $this->data['Schedule']['send_time_start']['year'].'-'.$this->data['Schedule']['send_time_start']['month'].'-'.$this->data['Schedule']['send_time_start']['day'].' '.$this->data['Schedule']['send_time_start']['hour'].':'.$this->data['Schedule']['send_time_start']['min'].':00',
            $this->data['Schedule']['send_time_end']['year'].'-'.$this->data['Schedule']['send_time_end']['month'].'-'.$this->data['Schedule']['send_time_end']['day'].' '.$this->data['Schedule']['send_time_end']['hour'].':'.$this->data['Schedule']['send_time_end']['min'].':00'
        );
        return $res;
    }
    
    public function senderSearch() {
        $this->Sms->User->Behaviors->attach('Search.Searchable');
        $res = $this->Sms->User->find('all', array(
            'conditions' => array(
                'User.phone_number LIKE' => '%'.$this->data['Schedule']['phone_number'].'%'
            )
        ));
        $return = 'Sms.user_id IN ("';
        if (!empty($res)) {
            $return .= implode('","', Set::extract('{n}/User/id', $res));
        }
        $return .= '")';
        return $return;
    }
    
    public function recipientSearch() {
        $this->Sms->Behaviors->attach('Search.Searchable');
        $res = $this->Sms->find('all', array(
            'conditions' => array(
                'Sms.recipient LIKE' => '%'.$this->data['Schedule']['recipient'].'%'
            )
        ));
        $return = 'Sms.id IN ("';
        if (!empty($res)) {
            $return .= implode('","', Set::extract('{n}/Sms/id', $res));
        }
        $return .= '")';
        return $return;
    }

/**
 * Display field
 *
 * @var string
 */
	public $displayField = 'id';


	//The Associations below have been created with all possible keys, those that are not needed can be removed

/**
 * belongsTo associations
 *
 * @var array
 */
	public $belongsTo = array(
		'Sms' => array(
			'className' => 'Sms',
			'foreignKey' => 'sms_id',
			'conditions' => '',
			'fields' => '',
			'order' => ''
		)
	);
}
