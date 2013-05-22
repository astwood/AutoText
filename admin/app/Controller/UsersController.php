<?php
App::uses('AppController', 'Controller');
/**
 * Users Controller
 *
 * @property User $User
 */

CakePlugin::load('Search');
class UsersController extends AppController {
    
    public $components = array('Search.Prg');
    public $presetVars = true;

/**
 * index method
 *
 * @return void
 */
	public function index() {
                $this->Prg->commonProcess();
		$this->User->recursive = 0;
		$this->set('users', $this->paginate('User', $this->User->parseCriteria($this->passedArgs)));
	}

/**
 * edit method
 *
 * @throws NotFoundException
 * @param string $id
 * @return void
 */
	public function edit($id = null) {
		if (!$this->User->exists($id)) {
			throw new NotFoundException(__('Invalid user'));
		}
		if ($this->request->is('post') || $this->request->is('put')) {
			if ($this->User->save($this->request->data)) {
				$this->Session->setFlash(__('The user has been saved'));
				$this->redirect(array('action' => 'index'));
			} else {
				$this->Session->setFlash(__('The user could not be saved. Please, try again.'));
			}
		} else {
                        $this->InternationalNumber = ClassRegistry::init('InternationalNumber');
			$options = array('conditions' => array('User.' . $this->User->primaryKey => $id));
                        $this->request->data = $this->User->find('first', $options);
                        $sent = $this->User->Sms->retrieveSent($this->request->data['User']['id']);
                        $scheduled = $this->User->Sms->retrieveScheduled($this->request->data['User']['id']);
                        $sentCount = count($sent);
                        $scheduledCount = count($scheduled);
                        $this->InternationalNumber->primaryKey = 'country_name_code';
                        $countries = $this->InternationalNumber->find('list', array(
                            'conditions' => array(
                                'InternationalNumber.available' => true
                            )
                        ));
                        $this->set(compact('sentCount', 'scheduledCount', 'countries'));
		}
	}

/**
 * delete method
 *
 * @throws NotFoundException
 * @param string $id
 * @return void
 */
	public function delete($id = null) {
		$this->User->id = $id;
		if (!$this->User->exists()) {
			throw new NotFoundException(__('Invalid user'));
		}
		$this->request->onlyAllow('post', 'delete');
		if ($this->User->delete()) {
			$this->Session->setFlash(__('User deleted'));
			$this->redirect(array('action' => 'index'));
		}
		$this->Session->setFlash(__('User was not deleted'));
		$this->redirect(array('action' => 'index'));
	}
}
