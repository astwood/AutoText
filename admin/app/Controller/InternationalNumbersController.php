<?php
App::uses('AppController', 'Controller');
/**
 * InternationalNumbers Controller
 *
 * @property InternationalNumber $InternationalNumber
 */
class InternationalNumbersController extends AppController {

    public $paginate = array(
        'limit' => 9999
    );
    public $helpers = array('Text');
    
/**
 * index method
 *
 * @return void
 */
	public function index() {
		$this->InternationalNumber->recursive = 0;
		$this->set('internationalNumbers', $this->paginate());
	}

/**
 * add method
 *
 * @return void
 */
	public function add() {
		if ($this->request->is('post')) {
			$this->InternationalNumber->create();
			if ($this->InternationalNumber->save($this->request->data)) {
				$this->Session->setFlash(__('The international number has been saved'));
				$this->redirect(array('action' => 'index'));
			} else {
				$this->Session->setFlash(__('The international number could not be saved. Please, try again.'));
			}
		}
	}

/**
 * edit method
 *
 * @throws NotFoundException
 * @param string $id
 * @return void
 */
	public function edit($id = null) {
		if (!$this->InternationalNumber->exists($id)) {
			throw new NotFoundException(__('Invalid international number'));
		}
		if ($this->request->is('post') || $this->request->is('put')) {
			if ($this->InternationalNumber->save($this->request->data)) {
				$this->Session->setFlash(__('The international number has been saved'));
				$this->redirect(array('action' => 'index'));
			} else {
				$this->Session->setFlash(__('The international number could not be saved. Please, try again.'));
			}
		} else {
			$options = array('conditions' => array('InternationalNumber.' . $this->InternationalNumber->primaryKey => $id));
			$this->request->data = $this->InternationalNumber->find('first', $options);
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
		$this->InternationalNumber->id = $id;
		if (!$this->InternationalNumber->exists()) {
			throw new NotFoundException(__('Invalid international number'));
		}
		$this->request->onlyAllow('post', 'delete');
		if ($this->InternationalNumber->delete()) {
			$this->Session->setFlash(__('International number deleted'));
			$this->redirect(array('action' => 'index'));
		}
		$this->Session->setFlash(__('International number was not deleted'));
		$this->redirect(array('action' => 'index'));
	}
}
