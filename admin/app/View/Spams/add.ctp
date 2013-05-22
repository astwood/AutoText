<div class="spams form">
<?php echo $this->Form->create('Spam'); ?>
	<fieldset>
		<legend><?php echo __('Add Spam'); ?></legend>
	<?php
		echo $this->Form->input('word');
	?>
	</fieldset>
<?php echo $this->Form->end(__('Submit')); ?>
</div>
<div class="actions">
	<h3><?php echo __('Actions'); ?></h3>
	<ul>

		<li><?php echo $this->Html->link(__('List Spams'), array('action' => 'index')); ?></li>
	</ul>
</div>
