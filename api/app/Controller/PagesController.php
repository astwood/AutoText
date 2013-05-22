<?php
App::uses('Controller', 'Controller');

class PagesController extends AppController {
    
    public $uses = array('InternationalNumber');
    
    /**
     * Retrieve terms
     */
    public function terms() {
        $this->renderJson(true, Configure::read('Settings.App_terms'));
    }
    
    public function credits() {
        $this->renderJson(true, $this->InternationalNumber->getAllCredits());
    }
}
