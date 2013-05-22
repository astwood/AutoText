<?php
App::uses('AppModel', 'Model');
/**
 * Spam Model
 *
 */
class Billing extends AppModel {
    
    public $order = 'Billing.created DESC';

/**
 * Display field
 *
 * @var string
 */
	public $displayField = 'word';

}
