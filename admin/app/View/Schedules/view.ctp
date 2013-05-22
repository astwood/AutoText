<div class="schedules view">
<h2><?php  echo __('Schedule'); ?></h2>
	<dl>
                <dt><?php echo __('Sms Recipient'); ?></dt>
		<dd>
			<?php echo h($schedule['Sms']['recipient']); ?>
			&nbsp;
		</dd>
		<dt><?php echo __('Sms Content'); ?></dt>
		<dd>
			<?php echo h($schedule['Sms']['content']); ?>
			&nbsp;
		</dd>
		<dt><?php echo __('Sms Name'); ?></dt>
		<dd>
			<?php echo h($schedule['Sms']['name']); ?>
			&nbsp;
		</dd>
		<dt><?php echo __('Sms Cost'); ?></dt>
		<dd>
			<?php echo h($schedule['Sms']['cost']); ?>
			&nbsp;
		</dd>
		<dt><?php echo __('Status'); ?></dt>
		<dd>
			<?php echo h($schedule['Schedule']['status']); ?>
			&nbsp;
		</dd>
		<dt><?php echo __('Send Time'); ?></dt>
		<dd>
			<?php echo h($schedule['Schedule']['send_time']); ?>
			&nbsp;
		</dd>
	</dl>
</div>
<div class="actions">
	<h3><?php echo __('Actions'); ?></h3>
	<ul>
		<li><?php echo $this->Html->link(__('List Schedules'), array('action' => 'index')); ?> </li>
	</ul>
</div>
