<div class="schedules index">
	<h2><?php echo __('Schedules'); ?></h2>
        
        <div><?php echo $this->Html->link('CSV Export', array('controller' => 'schedules', 'action' => 'csv', urlencode(str_replace('/', '||', $this->here)))); ?></div>
	<table cellpadding="0" cellspacing="0">
	<tr>
                        <th><?php echo $this->Paginator->sort('Sms.User.phone_number'); ?></th>
                        <th><?php echo $this->Paginator->sort('Sms.recipient'); ?></th>
                        <th><?php echo $this->Paginator->sort('Sms.content'); ?></th>
                        <th><?php echo $this->Paginator->sort('Sms.name'); ?></th>
                        <th><?php echo $this->Paginator->sort('Sms.cost'); ?></th>
			<th><?php echo $this->Paginator->sort('status'); ?></th>
			<th><?php echo $this->Paginator->sort('send_time'); ?></th>
			<th class="actions"><?php echo __('Actions'); ?></th>
	</tr>
	<?php foreach ($schedules as $schedule): ?>
	<tr>
		<td><?php echo h($schedule['Sms']['User']['phone_number']); ?>&nbsp;</td>
                <td><?php echo $this->Text->truncate(h($schedule['Sms']['recipient']), 35); ?>&nbsp;</td>
                <td><?php echo $this->Text->truncate(h($schedule['Sms']['content'], 50)); ?>&nbsp;</td>
                <td><?php echo $this->Text->truncate(h($schedule['Sms']['name'], 35)); ?>&nbsp;</td>
                <td><?php echo h($schedule['Sms']['cost']); ?>&nbsp;</td>
		<td><?php echo h($schedule['Schedule']['status']); ?>&nbsp;</td>
                <td><?php echo h($schedule['Schedule']['send_time']); ?>&nbsp;</td>
		<td class="actions">
			<?php echo $this->Html->link(__('View'), array('action' => 'view', $schedule['Schedule']['id'])); ?>
			<?php echo $this->Form->postLink(__('Delete'), array('action' => 'delete', $schedule['Schedule']['id']), null, __('Are you sure you want to delete # %s?', $schedule['Schedule']['id'])); ?>
		</td>
	</tr>
<?php endforeach; ?>
	</table>
	<p>
	<?php
	echo $this->Paginator->counter(array(
	'format' => __('Page {:page} of {:pages}, showing {:current} records out of {:count} total, starting on record {:start}, ending on {:end}')
	));
	?>	</p>
	<div class="paging">
	<?php
		echo $this->Paginator->prev('< ' . __('previous'), array(), null, array('class' => 'prev disabled'));
		echo $this->Paginator->numbers(array('separator' => ''));
		echo $this->Paginator->next(__('next') . ' >', array(), null, array('class' => 'next disabled'));
	?>
	</div>
        
        <?php
            echo $this->Form->create('Schedule', array(
                'url' => array_merge(array('action' => 'index'), $this->params['pass'])
            ));
            echo $this->Form->input('phone_number', array('label' => false, 'placeholder' => 'Sender Phone Number'));
            echo $this->Form->input('recipient', array('label' => false, 'placeholder' => 'Recipient Phone Number', 'type' => 'text'));
            echo $this->Form->input('send_time_start', array('label' => 'Start date', 'type' => 'datetime', 'dateFormat' => 'DMY', 'minYear' => 2013, 'maxYear' => date('Y'), 'timeFormat' => 24, 'separator' => ' ', 'selected' => array(
                'day' => 1,
                'month' => 1,
                'year' => 2013,
                'hour' => 0,
                'min' => 0
            )));
            echo $this->Form->input('send_time_end', array('label' => 'End date', 'type' => 'datetime', 'dateFormat' => 'DMY', 'minYear' => 2013, 'maxYear' => date('Y') + 10, 'timeFormat' => 24, 'separator' => ' '));
            echo $this->Form->input('status', array('type' => 'select', 'multiple' => true, 'options' => array(
                'scheduled' => 'Scheduled',
                'pending' => 'Sent',
                'delivered' => 'Delivered',
                'delivered_errors' => 'Sent with Errors',
                'failed' => 'Failed',
                'no_credit' => 'Flagged (no credit)',
                'spam_alert' => 'Flagged (spam alert)',
                'spam_fail' => 'Flagged (spam fail)'
            )));
            echo $this->Form->submit(__('Search'), array('div' => false));
            echo $this->Form->end();
        ?>
</div>
<div class="actions">
	<h3><?php echo __('Actions'); ?></h3>
</div>
