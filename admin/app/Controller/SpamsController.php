<?php
App::uses('AppController', 'Controller');
/**
 * Spams Controller
 *
 * @property Spam $Spam
 */
class SpamsController extends AppController {

    public $paginate = array(
        'limit' => 9999
    );
    
/**
 * index method
 *
 * @return void
 */
	public function index() {
		$this->Spam->recursive = 0;
		$this->set('spams', $this->paginate());
	}

/**
 * add method
 *
 * @return void
 */
	public function add() {
		if ($this->request->is('post')) {
			$this->Spam->create();
			if ($this->Spam->save($this->request->data)) {
				$this->Session->setFlash(__('The spam has been saved'));
				$this->redirect(array('action' => 'index'));
			} else {
				$this->Session->setFlash(__('The spam could not be saved. Please, try again.'));
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
		if (!$this->Spam->exists($id)) {
			throw new NotFoundException(__('Invalid spam'));
		}
		if ($this->request->is('post') || $this->request->is('put')) {
			if ($this->Spam->save($this->request->data)) {
				$this->Session->setFlash(__('The spam has been saved'));
				$this->redirect(array('action' => 'index'));
			} else {
				$this->Session->setFlash(__('The spam could not be saved. Please, try again.'));
			}
		} else {
			$options = array('conditions' => array('Spam.' . $this->Spam->primaryKey => $id));
			$this->request->data = $this->Spam->find('first', $options);
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
		$this->Spam->id = $id;
		if (!$this->Spam->exists()) {
			throw new NotFoundException(__('Invalid spam'));
		}
		$this->request->onlyAllow('post', 'delete');
		if ($this->Spam->delete()) {
			$this->Session->setFlash(__('Spam deleted'));
			$this->redirect(array('action' => 'index'));
		}
		$this->Session->setFlash(__('Spam was not deleted'));
		$this->redirect(array('action' => 'index'));
	}
}
