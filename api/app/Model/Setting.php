<?php
App::uses('Model', 'Model');

class Setting extends AppModel {
    
    public $primaryKey = 'name';
    public $displayField = 'value';
    
    /**
     * Change setting value and reload
     * @param string $name
     * @param string $value 
     */
    public function change($name, $value) {
        $this->id = $name;
        $this->saveField('value', $value);
        Configure::write('Settings.'.$name, $value);
    }
    
}
