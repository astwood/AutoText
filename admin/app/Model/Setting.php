<?php
App::uses('AppModel', 'Model');
/**
 * Setting Model
 *
 */
class Setting extends AppModel {
    
    public $order = 'Setting.name ASC';

/**
 * Primary key field
 *
 * @var string
 */
	public $primaryKey = 'name';

/**
 * Display field
 *
 * @var string
 */
	public $displayField = 'name';

}
