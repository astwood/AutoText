<?php
App::uses('Model', 'Model');

class Billing extends AppModel {
    
    public $belongsTo = array('User');
    
    /**
     * Return credits for product ID
     * @param string $productId
     * @return float|boolean 
     */
    public function getCreditsForProductId($productId) {
        $products = json_decode(Configure::read('Settings.App_products'), true);
        if (isset($products[$productId])) return $products[$productId];
        return false;
    }
    
    /**
     * Return if transaction has already been processed
     * @param string $transactionId
     * @return boolean 
     */
    public function alreadyProcessed($transactionId) {
        return $this->find('count', array(
            'conditions' => array(
                'Billing.transaction_id' => $transactionId
            ),
            'recursive' => -1
        )) > 0;
    }
    
}
