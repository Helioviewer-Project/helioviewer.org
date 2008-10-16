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
	colors = [('red', '#ff4848'), ('blue', '#0078ff'), ('orange', 'orange'), ('green','#b2ff66'), ('lightblue','#759fd9')]
	labels = ['AR', 'C', 'F', 'R2']

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
			small_text = SVG("text", 8, 12, font_size=10)(l)
			large_text = SVG("text", 19, 28, font_size=25)(l)

			#Create square icons
			small_rect = SVG("rect", x=0, y=0, width=16, height=16, fill=cValue, fill_opacity="60%")
			small_rect_svg = Canvas(16,16, SVG("g", small_rect, small_text))
			small_rect_svg.save("rect-" + cName + "-small-" + l + ".svg")


			large_rect = SVG("rect", x=0, y=0, width=40, height=40, fill=cValue, fill_opacity="60%")
			large_rect_svg = Canvas(40,40, SVG("g", large_rect, large_text))
			large_rect_svg.save("rect-" + cName + "-large-" + l + ".svg")

			#Create circle icons
			small_circle = SVG("circle", 8, 8, 8, fill=cValue, fill_opacity="70%")
			small_circle_svg = Canvas(16,16, SVG("g", small_circle, small_text))
			small_circle_svg.save("circle-" + cName + "-small-" + l + ".svg")

			large_circle = SVG("circle", 20, 20, 20, fill=cValue, fill_opacity="70%")
			large_circle_svg = Canvas(40,40, SVG("g", large_circle, large_text))
			large_circle_svg.save("circle-" + cName + "-large-" + l + ".svg")

def convertToPNGs():
	import glob, commands

	if not os.path.isdir("./png"):
		os.mkdir("./png");

	for i in glob.glob("./*.svg"):
		cmd = "convert -background none " + i + " ./png/" + i[2:-3] + "png"
		commands.getstatusoutput(cmd)


if __name__ == "__main__":
	main()
