<?php
    App::uses('Component', 'Controller');
    App::uses('HttpSocket', 'Network/Http');
    App::uses('CakeEmail', 'Network/Email');
    
    class MessageComponent extends Component {
        
        public $controller;
        
        public function initialize(Controller $controller) {
            $this->controller = $controller;
            return parent::initialize($controller);
        }
        
        /**
         * Send email from API
         * @param array|string $recipients
         * @param string $subject
         * @param string $viewName
         * @param array $data
         * @return array 
         */
        public function email($recipients = array(), $subject = '', $viewName = '', $data = array()) {
            $email = new CakeEmail('default');
            $View = new View();
            $email->from(array(Configure::read('Settings.App_adminEmail') => Configure::read('Settings.App_name')))
                  ->subject($subject);
            
            if (is_string($recipients)) {
                $email->to($recipients);
            } else {
                foreach ($recipients as $recipient) {
                    $email->to($recipient);
                }
            }
            return $email->send($View->element('/Emails/'.$viewName, $data));
        }
        
        /**
         * Send SMS via provider API
         * @param string $sender
         * @param array|string $recipients
         * @param string $viewName
         * @param array $data
         * @param string $custom
         * @param boolean $test
         * @return mixed 
         */
        public function sms($sender = '', $recipients = array(), $viewName = '', $data = array(), $custom = '', $test = false) {
            if (is_array($recipients)) {
                $recipients = implode(',', $recipients);
            }
            $View = new View();
            $data = array(
                'uname' => Configure::read('Settings.SmsAPI_user'),
                //'hash' => Configure::read('Settings.SmsAPI_key'),
                'pword' => Configure::read('Settings.SmsAPI_key'),
                'from' => $sender,
                'selectednums' => $recipients,
                'message' => $View->element('/Sms/'.$viewName, $data),
                'json' => 1,
                'rcpurl' => Router::url(array('controller' => 'sms', 'action' => 'receipt'), true),
                'custom' => $custom,
                'test' => $test
            );
            $socket = new HttpSocket();
            $res = $socket->post(Configure::read('Settings.SmsAPI_url'), $data);
            $res = json_decode($res->body);
            
            $fail = !isset($res->CreditsRemaining);
            
            if (!$test && !$fail) {
                // Update account credits remaining
                ClassRegistry::init('Setting')->change('SmsAPI_credit', $res->CreditsRemaining);
                if ($res->CreditsRemaining <= Configure::read('Settings.App_creditNotification')) {
                    $this->email(Configure::read('Settings.App_adminEmail'), __(Configure::read('Settings.App_name').' credits running low!'), 'admin_low_credit', array('credits' => $res->CreditsRemaining));
                }
            }
            
            // Error check
            if (!$test && isset($res->Error)) {
                $fail = $res->Error !== 'No credit' && $res->Error !== 'Not enough credit';
                $this->email(Configure::read('Settings.App_adminEmail'), __(Configure::read('Settings.App_name').' has received an API error from our SMS provider'), 'send_sms_error', array('error' => $res->Error));
            }
            
            if ($fail) return false;
            return $res;
        }
        
    }