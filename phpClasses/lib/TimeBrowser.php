<?php
class TimeBrowser {
  protected $srcs;

  function __construct($srcs) {
    $this->srcs = $srcs;
  }

  function descriptionHtml() {
    $c = 0;
    foreach ($this->srcs as $s) {
?>
<div class="tbTimeLine<?=$c?>"><?=strtoupper($s)?></div>
<?php
      $c = ($c+1) % 2;
    }
  }
  
  function dayHtml($date) {
    $height = 20;
    $distance = 5;
  
    $events = VsoEvent::getEvents($this->srcs, array($date, $date + 24*60*60));
?>
<div class="tbDayLabel">
<!--Day-->
<?=date('Y-m-d', $date)?>
</div>
<div class="tbLabels"><hr class="tbLineH" /><?php
    for($t=0; $t<24; $t++) {
      $left = round($t / 24 * 100, 1);
?>
<div class="tbLineV" style="left:<?=$left?>%"></div><?php
    }
?>
</div><div class="tbTimeLine">
<!--TimeLine-->
TimeLine w/ Markers
</div>
<!--<div class="tbTimeLine">-->
<!--SeparateTimeLines-->
<?php  

    $c = 0;
    $top = 60;
    foreach ($this->srcs as $s) {
?>
<div class="tbTimeLine<?=$c?>" style="position: relative">
<?php  
      if ($events[$s]) foreach ($events[$s] as $event) {
  //echo ((int) date('H', $event->timestamp) * 60 + (int) date('i', $event->timestamp));
        $left = round((date('H', $event->timestamp) * 60 + date('i', $event->timestamp)) / (24*60) * 100, 1);
?>
<div class="tbTLEPos" style="left:<?=$left?>%"><div class="tbTLE" style="background-color: #<?=($c == 0 ? '000' : '00f')?>" title="<?='[' . date('H:i', $event->timestamp) . '] ' . $event->name?>"></div></div><?php
      }
      $c = ($c+1) % 2;
      $top += $height + $distance;
?>
</div>
<?php
    }
?>
<!--</div>-->
<?php
  }

}
?>
