<?php
App::uses('AppModel', 'Model');
/**
 * User Model
 *
 * @property Billing $Billing
 * @property Group $Group
 * @property Sms $Sms
 */
CakePlugin::load('Search');
class User extends AppModel {

    public $actsAs = array('Search.Searchable');
    public $order = 'User.phone_number ASC';
    
    public $filterArgs = array(
        'phone_number' => array('type' => 'like')
    );
    
/**
 * Display field
 *
 * @var string
 */
	public $displayField = 'phone_number';


	//The Associations below have been created with all possible keys, those that are not needed can be removed

/**
 * hasMany associations
 *
 * @var array
 */
	public $hasMany = array(
		'Billing' => array(
			'className' => 'Billing',
			'foreignKey' => 'user_id',
			'dependent' => false,
			'conditions' => '',
			'fields' => '',
			'order' => '',
			'limit' => '',
			'offset' => '',
			'exclusive' => '',
			'finderQuery' => '',
			'counterQuery' => ''
		),
		'Group' => array(
			'className' => 'Group',
			'foreignKey' => 'user_id',
			'dependent' => false,
			'conditions' => '',
			'fields' => '',
			'order' => '',
			'limit' => '',
			'offset' => '',
			'exclusive' => '',
			'finderQuery' => '',
			'counterQuery' => ''
		),
		'Sms' => array(
			'className' => 'Sms',
			'foreignKey' => 'user_id',
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

}
