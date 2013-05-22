<?php
App::uses('Shell', 'Console');
App::import('Controller', 'Controller');
App::import('Component', 'Message');

class SpamNotificationShell extends AppShell {
    
    public $uses = array('Sms', 'Setting');
    
    /**
     * Runs when the shell is called
     */
    public function main() {
        $this->setup();
        
        if (Configure::read('Settings.App_sendSpamNotifications') == 1) {
            // Get spam SMS to be sent soon
            $emailNotification = Configure::read('Settings.App_spamEmailDays');
            $smsNotification = Configure::read('Settings.App_spamSmsDays');

            $this->msg('Checking for spam SMS\' to send soon');
            $res = $this->Sms->getSpamSendSoon();
            $this->msg('Got spam SMS\' to send soon:');
            $this->msg('... '.count($res['email']).' within '.$emailNotification.' days (email)');
            $this->msg('... '.count($res['sms']).' within '.$smsNotification.' days (SMS)');
            if (!empty($res['email'])) {
                // Send email notification
                $this->Message->email(Configure::read('Settings.App_adminEmail'), __(Configure::read('Settings.App_name').' spam messages are scheduled to be sent soon!'), 'spam_notification', array('count' => count($res['email']), 'max' => $emailNotification));
            }
            if (!empty($res['sms'])) {
                // Send SMS notification
                $this->Message->sms(Configure::read('Settings.App_name'), Configure::read('Settings.App_adminPhone'), 'spam_notification', array('count' => count($res['sms']), 'max' => $smsNotification));
            }
            
            ClassRegistry::init('Setting')->change('App_sendSpamNotifications', 0);
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
        $this->log($message, 'spam_notification_shell');
        $message = date('Y-m-d H:i:s').': '.__($message);
        return $this->out($message);
    }
    
}