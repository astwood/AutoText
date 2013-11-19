<?php
App::uses('Controller', 'Controller');

class BillingController extends AppController {
    
    /**
     * List App Store product IDs
     */
    public function listProducts() {
        $this->loadModel('Setting');
        $this->renderJson(true, json_decode(Configure::read('Settings.App_products')));
    }
    
    /**
     * Verify receipt from user with App Store and complete purchase
     */
    public function verify() {
        $fail = true;
        if (isset($this->request->data['transactionReceipt'])) {           
            // Post to App Store to validate
            $data = array('receipt-data' => $this->request->data['transactionReceipt']);
            //$ch = curl_init(Configure::read('Settings.AppStore_verifyUrl'));
            $ch = curl_init("https://buy.itunes.apple.com/verifyReceipt");
            curl_setopt ($ch, CURLOPT_SSL_VERIFYHOST, 0);
            curl_setopt ($ch, CURLOPT_SSL_VERIFYPEER, 0);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

            $res = curl_exec($ch);
            $err = curl_errno($ch);
            $errMsg = curl_error($ch);
            curl_close($ch);
            if ($errMsg == "" || $errMsg == null || $errMsg == 0 ) {
                $res = json_decode($res);
                if (isset($res->status) && $res->status == 0) 
                { // Valid receipt
                    // Check transaction hasn't already been processed
                    if (!$this->Billing->alreadyProcessed($res->receipt->transaction_id)) {
                        // Store purchase info
                        $credits = $this->Billing->getCreditsForProductId($res->receipt->product_id);

                        if($credits === false)
                        {
                            $this->renderJson(false, array('Message' => 'Product not found'));
                            $fail = false;
                        }
                        else
                        {
                            $userId = Configure::read('User.id');
                            $data = array( 
                                'product_id' => $res->receipt->product_id,
                                'transaction_id' => $res->receipt->transaction_id,
                                'credits' => $credits,
                                'user_id' => $userId
                            );
                            $this->Billing->create();
                            $this->Billing->save($data);
                            // Increase user's credits
                            $this->Billing->User->increaseCredits($userId, $credits);
                            
                            // Update no_credit statuses (user might have enough credit now)
                            $this->Billing->User->updateNoCreditStatuses($userId);

                            $fail = false;
                            $this->renderJson(true, array('credits' => $credits));
                        }
                    }
                }
            }
        }
        
        if ($fail) {
            $this->renderJson();
        }
    }
}
