<?php
App::uses('AppModel', 'Model');
/**
 * InternationalNumber Model
 *
 */
class InternationalNumber extends AppModel {
    
    public $order = 'InternationalNumber.country_name ASC';

/**
 * Display field
 *
 * @var string
 */
	public $displayField = 'country_name';

}
