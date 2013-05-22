<?php
App::uses('AppModel', 'Model');
/**
 * Spam Model
 *
 */
class Spam extends AppModel {
    
    public $order = 'Spam.word ASC';

/**
 * Display field
 *
 * @var string
 */
	public $displayField = 'word';

}
