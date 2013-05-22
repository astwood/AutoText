<div class="users form">
<?php echo $this->Form->create('User'); ?>
	<fieldset>
		<legend><?php echo __('Edit User'); ?></legend>
	<?php
		echo $this->Form->input('id');
		echo $this->Form->input('phone_number');
		echo $this->Form->input('country', array('type' => 'select', 'options' => $countries));
		echo $this->Form->input('active');
		echo $this->Form->input('remaining_credit');
	?>
                <div>Registered on <b><?php echo $this->data['User']['created']; ?></b>.</div>
                
                <div>Sent <b><?php echo $sentCount; ?></b> messages with <b><?php echo $scheduledCount; ?></b> more scheduled. <?php echo $this->Html->link('View messages', array('controller' => 'schedules', 'action' => 'index', 'phone_number:'.$this->data['User']['phone_number'])); ?>.</div>
                
                <div>
                    <h2>Purchase History</h2>
                    <div id="user-purchase-history-div">
                        <?php if (!empty($this->data['Billing'])): ?>
                            <?php foreach($this->data['Billing'] as $row): ?>
                                <div class="purchase-history-row">
                                    <p>Purchased <?php echo $row['credits']; ?> credits on <?php echo $row['created']; ?>. Product ID <?php echo $row['product_id']; ?>. Transaction ID: <?php echo $row['transaction_id']; ?></p>
                                </div>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                </div>
	</fieldset>
<?php echo $this->Form->end(__('Submit')); ?>
</div>
<div class="actions">
	<h3><?php echo __('Actions'); ?></h3>
	<ul>

		<li><?php echo $this->Form->postLink(__('Delete'), array('action' => 'delete', $this->Form->value('User.id')), null, __('Are you sure you want to delete # %s?', $this->Form->value('User.id'))); ?></li>
		<li><?php echo $this->Html->link(__('List Users'), array('action' => 'index')); ?></li>
	</ul>
</div>
