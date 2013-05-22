<div class="internationalNumbers form">
<?php echo $this->Form->create('InternationalNumber'); ?>
	<fieldset>
		<legend><?php echo __('Edit International Number'); ?></legend>
	<?php
		echo $this->Form->input('id');
		echo $this->Form->input('country_code');
		echo $this->Form->input('country_name');
		echo $this->Form->input('country_name_code');
		echo $this->Form->input('exit_code');
		echo $this->Form->input('trunk_code');
		echo $this->Form->input('available');
		echo $this->Form->input('area_codes');
		echo $this->Form->input('credits');
	?>
	</fieldset>
<?php echo $this->Form->end(__('Submit')); ?>
</div>
<div class="actions">
	<h3><?php echo __('Actions'); ?></h3>
	<ul>

		<li><?php echo $this->Form->postLink(__('Delete'), array('action' => 'delete', $this->Form->value('InternationalNumber.id')), null, __('Are you sure you want to delete # %s?', $this->Form->value('InternationalNumber.id'))); ?></li>
		<li><?php echo $this->Html->link(__('List Numbers'), array('action' => 'index')); ?></li>
	</ul>
</div>
