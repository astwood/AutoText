<div class="internationalNumbers index">
	<h2><?php echo __('International Numbers'); ?></h2>
	<table cellpadding="0" cellspacing="0">
	<tr>
			<th><?php echo $this->Paginator->sort('country_code'); ?></th>
			<th><?php echo $this->Paginator->sort('country_name'); ?></th>
			<th><?php echo $this->Paginator->sort('country_name_code'); ?></th>
			<th><?php echo $this->Paginator->sort('exit_code'); ?></th>
			<th><?php echo $this->Paginator->sort('trunk_code'); ?></th>
			<th><?php echo $this->Paginator->sort('available'); ?></th>
			<th><?php echo $this->Paginator->sort('area_codes'); ?></th>
			<th><?php echo $this->Paginator->sort('credits'); ?></th>
			<th class="actions"><?php echo __('Actions'); ?></th>
	</tr>
	<?php foreach ($internationalNumbers as $internationalNumber): ?>
	<tr>
		<td><?php echo h($internationalNumber['InternationalNumber']['country_code']); ?>&nbsp;</td>
		<td><?php echo h($internationalNumber['InternationalNumber']['country_name']); ?>&nbsp;</td>
		<td><?php echo h($internationalNumber['InternationalNumber']['country_name_code']); ?>&nbsp;</td>
		<td><?php echo h($internationalNumber['InternationalNumber']['exit_code']); ?>&nbsp;</td>
		<td><?php echo h($internationalNumber['InternationalNumber']['trunk_code']); ?>&nbsp;</td>
		<td><?php echo h($internationalNumber['InternationalNumber']['available']); ?>&nbsp;</td>
		<td><?php echo $this->Text->truncate(h($internationalNumber['InternationalNumber']['area_codes']), 26); ?>&nbsp;</td>
		<td><?php echo h($internationalNumber['InternationalNumber']['credits']); ?>&nbsp;</td>
		<td class="actions">
			<?php echo $this->Html->link(__('Edit'), array('action' => 'edit', $internationalNumber['InternationalNumber']['id'])); ?>
			<?php echo $this->Form->postLink(__('Delete'), array('action' => 'delete', $internationalNumber['InternationalNumber']['id']), null, __('Are you sure you want to delete # %s?', $internationalNumber['InternationalNumber']['id'])); ?>
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
</div>
<div class="actions">
	<h3><?php echo __('Actions'); ?></h3>
	<ul>
		<li><?php echo $this->Html->link(__('New Number'), array('action' => 'add')); ?></li>
	</ul>
</div>
