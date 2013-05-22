<?php
App::uses('Shell', 'Console');
App::import('Controller', 'Controller');
App::import('Component', 'Message');

class SendSmsShell extends AppShell {
    
    public $uses = array('Sms', 'Setting', 'User');
    
    /**
     * Runs when the shell is called
     */
    public function main() {
        $this->setup();
        
        // Get SMS ready to be sent
        $res = $this->Sms->getReadyToSend();
        
        if (!empty($res)) {
            $this->msg('Got SMS\' to send ('.count($res).')');
            
            foreach ($res as $row) {
                // Send each SMS
                $fail = true;
                
                $sender = $row['User']['phone_number'];
                $res = ClassRegistry::init('InternationalNumber')->findByCountryNameCode($row['User']['country']);
                $res = $res['InternationalNumber'];
                $sender = $res['country_code'].substr($sender, strlen($res['exit_code']));
                
                $recipients = explode(',', $row['Sms']['recipient']);
                $sendRes = $this->Message->sms(
                    $row['Sms']['reminder'] == 0 ? $sender : __('Remember To:'),
                    $recipients,
                    'sms',
                    array('content' => $row['Sms']['content']),
                    $row['Schedule']['id'].'&'.$this->Sms->Schedule->verifyReceiptCode($row['Schedule']['id'])
                );
                
                if ($sendRes !== false && !isset($sendRes->Error)) {
                    // Sent OK
                    $fail = false;
                    $this->User->deductCredits($row['User']['id'], $row['Sms']['cost']);
                    $this->Sms->Schedule->status($row['Schedule']['id'], 'pending');
                    $this->Sms->Schedule->done($row['Schedule']['id']);
                    $this->msg('Sent from '.$row['User']['phone_number'].' to '.count($recipients).' numbers ('.$row['Schedule']['id'].')');
                } else {
                    // Send failed
                    if (isset($sendRes->Error)) {
                        // Not enough account credit so flag as pending and send ASAP
                        $fail = false;
                        $this->Sms->Schedule->status($row['Schedule']['id'], 'pending');
                        $this->Sms->Schedule->processing($row['Schedule']['id'], 0);
                        $this->msg('Pending from '.$row['User']['phone_number'].' to '.count($recipients).' numbers - NOT ENOUGH ACCOUNT CREDIT ('.$row['Schedule']['id'].')');
                    }
                }
                
                if ($fail) {
                    // Send failed for an unknown reason
                    $this->msg('Failed from '.$row['User']['phone_number'].' to '.count($recipients).' numbers ('.$row['Schedule']['id'].')');
                }
            }
        }
    }
    
    /**
     * Setup the shell
     */
    public function setup() {
        // Load settings
        Configure::write('Settings', $this->Setting->find('list'));
        
        // Initialise components
        $collection = new ComponentCollection();
        $controller = new Controller();
        $this->Message = new MessageComponent($collection);
        $this->Message->initialize($controller);
    }
    
    /**
     * Append timestamp to output messages
     * @param string|array $message
     * @return integer|boolean 
     */
    public function msg($message = null) {
        $this->log($message, 'send_sms_shell');
        $message = date('Y-m-d H:i:s').': '.__($message);
        return $this->out($message);
    }
    
}