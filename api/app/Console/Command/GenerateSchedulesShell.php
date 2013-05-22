<?php
App::uses('Shell', 'Console');
App::import('Controller', 'Controller');
App::import('Component', 'Message');

class GenerateSchedulesShell extends AppShell {
    
    public $uses = array('Sms', 'Setting', 'User', 'Schedule');
    
    /**
     * Runs when the shell is called
     */
    public function main() {
        $this->setup();
        
        $res = $this->Sms->needSchedulesGenerating();
        if (!empty($res)) {
            $this->msg('Got SMS\' to generate schedules for ('.count($res).')');
            
            foreach ($res as $row) {
                if (!empty($row['Sms']['repeat_options'])) {
                    $excludeDates = array();
                    if (!empty($row['Sms']['deleted_dates'])) {
                        $excludeDates = json_decode($row['Sms']['deleted_dates']);
                    }
                    
                    $this->Schedule->removeNoCredit($row['Sms']['id']);
                    
                    $lastSchedule = strtotime($row['Schedule']['send_time']);
                    
                    $totalCredits = $this->User->getCredits($row['Sms']['user_id']) - $this->User->getAllocatedCredits($row['Sms']['user_id']);
                    $canAfford = floor($totalCredits / $row['Sms']['cost']);

                    // Create repeat Schedule(s)
                    $repeats = false;
                    $spent = 1;
                    $repeat = json_decode($row['Sms']['repeat_options']);
                    if (is_object($repeat)) {
                        if ($repeat->D == 1) { // Daily
                            $repeats = true;
                            for ($i = 1; $i <= Configure::read('Settings.App_scheduleDays'); $i++) {
                                $newTime = strtotime($row['Schedule']['send_time'].' + '.$i.' days');
                                if (!in_array($newTime, $excludeDates)) {
                                    if ($spent <= $canAfford && ($repeat->WD == 0 || date('N', $newTime) < 6)) {
                                        $lastSchedule = $newTime;
                                        $this->Sms->set($row['Sms']);
                                        $this->Sms->createSchedule($row['Sms']['id'], date('Y-m-d H:i:s', $newTime));
                                        $spent++;
                                    } else if ($spent > $canAfford || $canAfford == 0) {
                                        if ($this->Sms->alreadyScheduledNoCredit($row['Sms']['id'])) break;

                                        $this->Sms->set($row['Sms']);
                                        $this->Sms->createSchedule($row['Sms']['id'], date('Y-m-d H:i:s', $newTime), 'no_credit');
                                        break;
                                    }
                                }
                            }
                        } else if ($repeat->W == 1) { // Weekly
                            $repeats = true;
                            for ($i = 1; $i <= Configure::read('Settings.App_scheduleDays'); $i++) {
                                $newTime = strtotime($row['Schedule']['send_time'].' + '.$i.' days');
                                if (!in_array($newTime, $excludeDates) && $i % 7 == 0) {
                                    if ($spent <= $canAfford && ($repeat->WD == 0 || date('N', $newTime) < 6)) {
                                        $lastSchedule = $newTime;
                                        $this->Sms->set($row['Sms']);
                                        $this->Sms->createSchedule($row['Sms']['id'], date('Y-m-d H:i:s', $newTime));
                                        $spent++;
                                    } else if ($spent > $canAfford || $canAfford == 0) {
                                        if ($this->Sms->alreadyScheduledNoCredit($row['Sms']['id'])) break;

                                        $this->Sms->set($row['Sms']);
                                        $this->Sms->createSchedule($row['Sms']['id'], date('Y-m-d H:i:s', $newTime), 'no_credit');
                                        break;
                                    }
                                }
                            }
                        } else if ($repeat->M == 1) { // Monthly
                            $repeats = true;
                            for ($i = 1; $i <= Configure::read('Settings.App_scheduleDays'); $i++) {
                                $startTime = strtotime($row['Schedule']['send_time']);
                                $newTime = strtotime($row['Schedule']['send_time'].' + '.$i.' days');
                                if (!in_array($newTime, $excludeDates) && date('d', $startTime) == date('d', $newTime)) {
                                    if ($spent <= $canAfford && ($repeat->WD == 0 || date('N', $newTime) < 6)) {
                                        $lastSchedule = $newTime;
                                        $this->Sms->set($row['Sms']);
                                        $this->Sms->createSchedule($row['Sms']['id'], date('Y-m-d H:i:s', $newTime));
                                        $spent++;
                                    } else if ($spent > $canAfford || $canAfford == 0) {
                                        if ($this->Sms->alreadyScheduledNoCredit($row['Sms']['id'])) break;

                                        $this->Sms->set($row['Sms']);
                                        $this->Sms->createSchedule($row['Sms']['id'], date('Y-m-d H:i:s', $newTime), 'no_credit');
                                        break;
                                    }
                                }
                            }
                        } else if ($repeat->Y == 1) { // Yearly
                            $repeats = true;
                            for ($i = 1; $i <= Configure::read('Settings.App_scheduleDays'); $i++) {
                                $startTime = strtotime($row['Schedule']['send_time']);
                                $newTime = strtotime($row['Schedule']['send_time'].' + '.$i.' days');
                                if (!in_array($newTime, $excludeDates) && date('d', $startTime) == date('d', $newTime) && date('m', $startTime) == date('m', $newTime)) {
                                    if ($spent <= $canAfford && ($repeat->WD == 0 || date('N', $newTime) < 6)) {
                                        $lastSchedule = $newTime;
                                        $this->Sms->set($row['Sms']);
                                        $this->Sms->createSchedule($row['Sms']['id'], date('Y-m-d H:i:s', $newTime));
                                        $spent++;
                                    } else if ($spent > $canAfford || $canAfford == 0) {
                                        if ($this->Sms->alreadyScheduledNoCredit($row['Sms']['id'])) break;

                                        $this->Sms->set($row['Sms']);
                                        $this->Sms->createSchedule($row['Sms']['id'], date('Y-m-d H:i:s', $newTime), 'no_credit');
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    // Set date for next Schedule generation if message is to repeat
                    $nextScheduleDate = '';
                    if ($repeats) {
                        $nextScheduleDate = date('Y-m-d H:i:s', strtotime(date('Y-m-d H:i:s', $lastSchedule).' - 2 days'));
                    }
                    $this->Sms->query('UPDATE `sms` SET `next_schedule_gen` = "'.$nextScheduleDate.'" WHERE `id` = "'.$row['Sms']['id'].'";');
                    $this->Sms->User->deductCredits($row['Sms']['user_id'], 0, ($spent - 1) * $row['Sms']['cost']);
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
        $this->log($message, 'generate_schedules_shell');
        $message = date('Y-m-d H:i:s').': '.__($message);
        return $this->out($message);
    }
    
}