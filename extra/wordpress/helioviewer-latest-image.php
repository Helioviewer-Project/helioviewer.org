<?php
/**
 * @package Helioviewer
 * @version 0.1
 */
/*
Plugin Name: Helioviewer.org - Latest Image
Description: Displays the most recent image of the Sun from Helioviewer.org.
Author: Keith Hughitt
Author URI: https://launchpad.net/~keith-hughitt
License: Mozilla Public License 1.1
Version: 0.5
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
            array("description" => "Displays the most recent image of the Sun from Helioviewer.org.")
        );
    }

    /** @see WP_Widget::widget */
    function widget($args, $instance) {
        extract( $args );        
        $ds = $instance['datasource'];
    ?>
<div id='helioviewer-wordpress-widget'>
    <h3 class="widget-title">Helioviewer.org</h3>
    <a href='http://www.helioviewer.org' target="_blank">
        <img src="http://helioviewer.org/api/?action=takeScreenshot&date=2099-01-01T00:00:00.000Z&layers=<?php echo $ds;?>&imageScale=9.6&x1=-1228.8&y1=-1228.8&x2=1228.8&y2=1228.8&display=true" alt="Latest AIA 304 image from Helioviewer.org." style='width: 100%;' />
    </a>
</div>
    <?php
    }

    /** @see WP_Widget::update */
    function update($new_instance, $old_instance) {
        $instance = $old_instance;
        $instance['datasource'] = strip_tags($new_instance['datasource']);
        return $instance;
    }

    /** @see WP_Widget::form */
    function form($instance) {
        $datasource = esc_attr($instance['datasource']);
        
        $opts = array(
            "AIA 131" => "[SDO,AIA,AIA,131,1,100]",
            "AIA 171" => "[SDO,AIA,AIA,171,1,100]",
            "AIA 193" => "[SDO,AIA,AIA,193,1,100]",
            "AIA 211" => "[SDO,AIA,AIA,211,1,100]",
            "AIA 304" => "[SDO,AIA,AIA,304,1,100]",
            "AIA 335" => "[SDO,AIA,AIA,335,1,100]",
            "HMI Magnetogram" => "[SDO,HMI,HMI,magnetogram,1,100]"
        );
        
        echo "<label for=\"" . $this->get_field_id("datasource") . "\">Image Type";
        echo "<select id=\"" . $this->get_field_id("datasource") . "\" name=\"" . $this->get_field_name("datasource") . "\">";
        
        foreach($opts as $name => $value) {
            $selected = $datasource == $value ? " selected=\"selected\"" : "";
            echo "<option value='$value'$selected>$name</option>"; 
        }
        
        echo "</select></label>";
    }

} // class HelioviewerLatestImageWidget

add_action('widgets_init', create_function('', 'return register_widget("HelioviewerLatestImageWidget");'));
?>
