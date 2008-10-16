#!/usr/bin/python
import Image, ImageDraw

def main():
	im = Image.new('RGBA', (100,100))
	draw = ImageDraw.Draw(im)

	draw.ellipse((0,0,100,100), fill="black", outline="black")
	draw.ellipse((2,2,98,98), fill="red", outline="red")

	# resize
	im.resize((50,50), Image.ANTIALIAS)

	del draw

	# write to stdout
	im.save('tmp.png', "PNG")

if __name__ == "__main__":
	main()
