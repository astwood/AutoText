<?php
App::uses('AppController', 'Controller');
/**
 * Schedules Controller
 *
 * @property Schedule $Schedule
 */

CakePlugin::load('Search');
class SchedulesController extends AppController {

    public $components = array('Search.Prg');
    public $presetVars = true;
    public $helpers = array('Text');
    
/**
 * index method
 *
 * @return void
 */
	public function index() {
                $this->Prg->commonProcess();
		$this->Schedule->recursive = 2;
                $this->Schedule->set($this->passedArgs);
                $data = $this->paginate('Schedule', $this->Schedule->parseCriteria($this->passedArgs));
		$this->set('schedules', $data);
	}

/**
 * view method
 *
 * @throws NotFoundException
 * @param string $id
 * @return void
 */
	public function view($id = null) {
		if (!$this->Schedule->exists($id)) {
			throw new NotFoundException(__('Invalid schedule'));
		}
		$options = array('conditions' => array('Schedule.' . $this->Schedule->primaryKey => $id));
		$this->set('schedule', $this->Schedule->find('first', $options));
	}

/**
 * delete method
 *
 * @throws NotFoundException
 * @param string $id
 * @return void
 */
	public function delete($id = null) {
		$this->Schedule->id = $id;
		if (!$this->Schedule->exists()) {
			throw new NotFoundException(__('Invalid schedule'));
		}
		$this->request->onlyAllow('post', 'delete');
		if ($this->Schedule->delete()) {
			$this->Session->setFlash(__('Schedule deleted'));
			$this->redirect(array('action' => 'index'));
		}
		$this->Session->setFlash(__('Schedule was not deleted'));
		$this->redirect(array('action' => 'index'));
	}
        
        public function csv($params = '') {
            $tmp = str_replace('||', '/', urldecode($params));
            $tmp = explode('/', $tmp);
            if (isset($tmp[0])) unset($tmp[0]);
            if (isset($tmp[1])) unset($tmp[1]);
            if (isset($tmp[2])) unset($tmp[2]);
            if (isset($tmp[3])) unset($tmp[3]);
            
            $params = array();
            if (count($tmp) > 0) {
                foreach($tmp as $row) {
                    list($key, $val) = explode(':', $row);
                    if (!empty($key) && !empty($val)) {
                        $pos = strpos($key, '[');
                        if ($pos !== false) {
                            $subKey = substr($key, $pos + 1, strpos($key, ']') - $pos - 1);
                            $params[substr($key, 0, $pos)][$subKey] = $val;
                        } else {
                            $params[$key] = $val;
                        }
                    }
                }
            }
            
            $this->Prg->commonProcess();
            $this->Schedule->recursive = 2;
            $this->Schedule->set($params);
            $this->request->params['named']['page'] = isset($params['page']) ? $params['page'] : 1;
            $data = $this->paginate('Schedule', $this->Schedule->parseCriteria($params));
            
            header('Content-Type: text/csv');
            header('Content-disposition:attachment;filename=messages_'.date('Y-m-d H:i:s').'.csv');
            echo '"Sms User Phone Number",';
            echo '"Sms Recipient",';
            echo '"Sms Content",';
            echo '"Sms Name",';
            echo '"Sms Cost",';
            echo '"Status",';
            echo '"Send Time"';
            echo "\n";
            
            if (!empty($data)) {
                foreach ($data as $row) {
                    echo '"'.str_replace('"', '\"', $row['Sms']['User']['phone_number']).'","';
                    echo str_replace('"', '\"', $row['Sms']['recipient']).'","';
                    echo str_replace('"', '\"', $row['Sms']['content']).'","';
                    echo str_replace('"', '\"', $row['Sms']['name']).'","';
                    echo str_replace('"', '\"', $row['Sms']['cost']).'","';
                    echo str_replace('"', '\"', $row['Schedule']['status']).'","';
                    echo str_replace('"', '\"', $row['Schedule']['send_time']).'"';
                    echo "\n";
                }
            }
            
            exit;
        }
}
