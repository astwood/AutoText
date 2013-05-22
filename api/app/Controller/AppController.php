<?php
App::uses('Controller', 'Controller');

class AppController extends Controller {
    
    public $uses = array(
        'Setting',
        'User'
    );
    
    // Controller actions that don't require logins
    public $noLogin = array(
        'pages' => array(
            'terms' => true
        ),
        'sms' => array(
            'receipt' => true
        ),
        'users' => array(
            'login' => true,
            'register' => true,
            'forgotten' => true,
            'verify' => true,
            'countries' => true,
            'formatting' => true,
            'getExitCode' => true
        )
    );
    public $failedLogin = true;
    
    public function beforeFilter() {
        // Allow anyone to call API and don't cache responses
        header('Access-Control-Allow-Origin: *');
        header('Cache-Control: no-cache');
        
        // Stop automatic CakePHP view rendering
        $this->layout = false;
        $this->autoRender = false;
        
        // Load settings
        Configure::write('Settings', $this->Setting->find('list'));
        
        $this->loginUser();
        
        return parent::beforeFilter();
    }
    
    /**
     *  Attempt to log user in if passed as GET parameters u (phone number) and p (password)
     */
    public function loginUser() {
        $user = array();
        $qry = $this->request->query;
        if (isset($qry['u']) && isset($qry['p'])) {
            $data = array(
                'phone_number' => $qry['u'],
                'password' => $qry['p']
            );
            $res = $this->User->loginUser($data);
            if ($res !== false) {
                $user = $res;
            }
        }
        Configure::write('User', $user);
        
        // If user has to be logged in enforce it.
        $requireLogin = isset($this->noLogin[$this->request->controller]) && isset($this->noLogin[$this->request->controller][$this->request->action]) ? false : true;
        if ($requireLogin && empty($user)) exit;
    }
    
    /**
     * Output $response as JSON (used for API responses)
     * @param boolean $response 
     * @param array $data
     */
    protected function renderJson($success = false, $data = null) {
        $response = array(
            'status' => $success ? 'OK' : 'FAIL'
        );
        if ($data !== null) {
            $response['data'] = $data;
        }
        $this->set('response', $response);
        $this->render('/Display/json');
    }
    
}