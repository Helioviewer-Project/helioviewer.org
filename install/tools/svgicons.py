#!/usr/bin/python
# -*- coding: utf-8 -*-
##############################################################################
#
# SVG Icon-Set Builder
# By Keith Hughitt, Oct 2008
#
# Requires: svgfig (2.x), ImageMagick
#
##############################################################################
import os
from svgfig.interactive import *

def main():
	output_dir = "icons"
	colors = [('red', '#ff4848'), ('blue', '#0078ff'), ('orange', 'orange'), ('yellow', 'yellow'), ('green','#b2ff66'), ('lightblue','#759fd9')]
	labels = [('Active_Region', 'AR'), ('CME', 'C'), ('Solar_Flare', 'F'), ('Type_II_Radio_Burst', 'R2')]

	if not os.path.isdir("./" + output_dir):
		os.mkdir("./" + output_dir);

	os.chdir(output_dir)

	createSVGs(colors, labels)
	convertToPNGs()


def createSVGs(colors, labels):


	for c in colors:
		cName =  c[0]
		cValue = c[1]

		for l in labels:
			lName = l[0]
			lValue = l[1]

			small_text    =	SVG("text", 8, 12, font_size=10)(lValue)
			smaller_text  =	SVG("text", 8, 11, font_size=8)(lValue)
			medium_text   = SVG("text", 19, 27, font_size=21)(lValue)
			large_text =	SVG("text", 19, 28, font_size=25)(lValue)

			#Create square icons
			small_rect = SVG("rect", x=0, y=0, width=16, height=16, fill=cValue, fill_opacity="75%")
			small_rect_svg = Canvas(16,16, SVG("g", small_rect, small_text))
			small_rect_svg.save("small-" + cName + "-square-" + lName + ".svg")


			large_rect = SVG("rect", x=0, y=0, width=40, height=40, fill=cValue, fill_opacity="75%")
			large_rect_svg = Canvas(40,40, SVG("g", large_rect, large_text))
			large_rect_svg.save("large-" + cName + "-square-" + lName + ".svg")

			#Create circle icons
			small_circle = SVG("circle", 8, 8, 8, fill=cValue, fill_opacity="75%")
			small_circle_svg = Canvas(16,16, SVG("g", small_circle, small_text))
			small_circle_svg.save("small-" + cName + "-circle-" + lName + ".svg")

			large_circle = SVG("circle", 20, 20, 20, fill=cValue, fill_opacity="75%")
			large_circle_svg = Canvas(40,40, SVG("g", large_circle, large_text))
			large_circle_svg.save("large-" + cName + "-circle-" + lName + ".svg")

			#Create rhombus icons
			small_diamond = SVG("path", "M 8 0 L 16 8 L 8 16 L 0 8 z", fill=cValue, fill_opacity="75%")
			small_diamond_svg = Canvas(16,16, SVG("g", small_diamond, smaller_text))
			small_diamond_svg.save("small-" + cName + "-diamond-" + lName + ".svg")

			large_diamond = SVG("path", "M 20 0 L 40 20 L 20 40 L 0 20 z", fill=cValue, fill_opacity="75%")
			large_diamond_svg = Canvas(40,40, SVG("g", large_diamond, medium_text))
			large_diamond_svg.save("large-" + cName + "-diamond-" + lName + ".svg")

			#Create small empty copies of each shape and color combination for user customization
			empty_rect = Canvas(16,16, SVG("rect", x=0, y=0, width=16, height=16, fill=cValue, fill_opacity="75%"))
			empty_rect.save("small-" + cName + "-square.svg")
			empty_circle = Canvas(16,16, SVG("circle", 8, 8, 8, fill=cValue, fill_opacity="75%"))
			empty_circle.save("small-" + cName + "-circle.svg")
			empty_diamond = Canvas(16,16, SVG("path", "M 8 0 L 16 8 L 8 16 L 0 8 z", fill=cValue, fill_opacity="75%"))
			empty_diamond.save("small-" + cName + "-diamond.svg")


def convertToPNGs():
	import glob, commands

	if not os.path.isdir("./png"):
		os.mkdir("./png");

	for i in glob.glob("./*.svg"):
		cmd = "convert -background none " + i + " ./png/" + i[2:-3] + "png"
		commands.getstatusoutput(cmd)


if __name__ == "__main__":
	main()
