<?php
/**
 * @package Helioviewer
 * @version 0.8
 */
/*
Plugin Name: Helioviewer.org - Latest Image
Description: Displays the most recent image of the Sun from Helioviewer.org.
Author: Keith Hughitt
Author URI: https://launchpad.net/~keith-hughitt
License: Mozilla Public License 1.1
Version: 0.8
*/

/**
 * Helioviewer.org - Latest Image Widget Class
 */
class HelioviewerLatestImageWidget extends WP_Widget {
    /** constructor */
    function HelioviewerLatestImageWidget() {
        parent::WP_Widget(
            false, 
            $name='Helioviewer.org - Latest Image', 
            array('description' => 'Displays the most recent image of the Sun from Helioviewer.org.')
        );
    }

    /** @see WP_Widget::widget */
    function widget($args, $instance) {
        extract( $args );
        
        // Select random layer to use, if enabled
        if ($instance['datasource'] == 'random') {
            $opts = array(
                '[SDO,AIA,AIA,131,1,100]',
                '[SDO,AIA,AIA,171,1,100]',
                '[SDO,AIA,AIA,193,1,100]',
                '[SDO,AIA,AIA,211,1,100]',
                '[SDO,AIA,AIA,304,1,100]',
                '[SDO,AIA,AIA,335,1,100]',
                '[SDO,HMI,HMI,continuum,1,100]',
                '[SDO,HMI,HMI,magnetogram,1,100]'
            );
            $datasource = $opts[array_rand($opts)];
        } else {
            // Otherwise use the specified layer
            $datasource = $instance['datasource'];
        }
        
        // Rounded corners?
        $style = "";        
        if ($instance['roundedCorners']) {
            $style=' -moz-border-radius:10px; -webkit-border-radius:10px; border-radius:10px;';
        }
        
    ?>
<div id='helioviewer-wordpress-widget'>
    <h3 class="widget-title"><?php echo $instance['title'];?></h3>
    <a href='http://www.helioviewer.org' target="_blank">
        <img src="http://helioviewer.org/api/?action=takeScreenshot&date=2999-01-01T00:00:00.000Z&layers=<?php echo $datasource;?>&imageScale=9.6&x1=-1228.8&y1=-1228.8&x2=1228.8&y2=1228.8&display=true" 
            alt="Latest image from Helioviewer.org." 
            style='width: 100%;<?php echo $style;?>' />
    </a>
</div>
    <?php
    }

    /** @see WP_Widget::update */
    function update($new_instance, $old_instance) {
        $instance = $old_instance;
        $instance['datasource'] = strip_tags($new_instance['datasource']);
        $instance['title'] = strip_tags($new_instance['title']);
        $instance['roundedCorners'] = strip_tags($new_instance['roundedCorners']);
        return $instance;
    }

    /** @see WP_Widget::form */
    function form($instance) {
        $datasource = esc_attr($instance['datasource']);
        $title = esc_attr($instance['title']);
        $roundedCorners = esc_attr($instance['roundedCorners']) == 'true' ? 'checked="checked"' : '';
        
        if (!$title) {
            $title = 'Latest Image of the Sun';
        }
        
        // Title
        echo '<label for="' . $this->get_field_id('title') . '" style="font-size:12px;">Title:<br />';
        echo '<input type="text" name="' . $this->get_field_name('title') . "\" value=\"$title\" class=\"widefat\" /><br /><br />";
        echo '</label>';
        
        // Layer choice
        $opts = array(
            'AIA 131'         => '[SDO,AIA,AIA,131,1,100]',
            'AIA 171'         => '[SDO,AIA,AIA,171,1,100]',
            'AIA 193'         => '[SDO,AIA,AIA,193,1,100]',
            'AIA 211'         => '[SDO,AIA,AIA,211,1,100]',
            'AIA 304'         => '[SDO,AIA,AIA,304,1,100]',
            'AIA 335'         => '[SDO,AIA,AIA,335,1,100]',
            'HMI Continuum'   => '[SDO,HMI,HMI,continuum,1,100]',
            'HMI Magnetogram' => '[SDO,HMI,HMI,magnetogram,1,100]',
            'Random'          => 'random'
        );
        
        echo '<label for="' . $this->get_field_id('datasource') . '" style="font-size:12px;">Image Type:<br />';
        echo '<select id="' . $this->get_field_id('datasource') . '" name="' . $this->get_field_name('datasource') . '">';
        
        foreach($opts as $name => $value) {
            $selected = $datasource == $value ? ' selected="selected"' : '';
            echo "<option value='$value'$selected>$name</option>"; 
        }
        echo '</select></label><br /><br />';
        
        // Rounded Corners
        echo '<label for="' . $this->get_field_id('roundedCorners') . '" style="font-size:12px;">Rounded Corners:';
        echo '<input type="checkbox" name="' . $this->get_field_name('roundedCorners') . "\" $roundedCorners value=\"true\" /><br />";
        echo '</label>';
    }

} // class HelioviewerLatestImageWidget

add_action('widgets_init', create_function('', 'return register_widget("HelioviewerLatestImageWidget");'));
?>
