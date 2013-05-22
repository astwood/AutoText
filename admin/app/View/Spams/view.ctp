<div class="spams view">
<h2><?php  echo __('Spam'); ?></h2>
	<dl>
		<dt><?php echo __('Id'); ?></dt>
		<dd>
			<?php echo h($spam['Spam']['id']); ?>
			&nbsp;
		</dd>
		<dt><?php echo __('Word'); ?></dt>
		<dd>
			<?php echo h($spam['Spam']['word']); ?>
			&nbsp;
		</dd>
	</dl>
</div>
<div class="actions">
	<h3><?php echo __('Actions'); ?></h3>
	<ul>
		<li><?php echo $this->Html->link(__('Edit Spam'), array('action' => 'edit', $spam['Spam']['id'])); ?> </li>
		<li><?php echo $this->Form->postLink(__('Delete Spam'), array('action' => 'delete', $spam['Spam']['id']), null, __('Are you sure you want to delete # %s?', $spam['Spam']['id'])); ?> </li>
		<li><?php echo $this->Html->link(__('List Spams'), array('action' => 'index')); ?> </li>
		<li><?php echo $this->Html->link(__('New Spam'), array('action' => 'add')); ?> </li>
	</ul>
</div>
