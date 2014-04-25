'use strict';

/* Bring in dependencies */
var path = require('path');
var hb = require('handlebars');
var fs = require('fs-extra');
var cheerio = require('cheerio');
var resources = path.join(path.dirname(module.filename), "reveal");

/* This is the code that actually generates the presentation. */
function generate(context, metadata, dst) {
    /* Copy CSS resources needed by reveal. */
    var cssdir = path.join(resources, "css");
    if (fs.existsSync(cssdir)) fs.copySync(cssdir, path.join(dst, "css"));
    else { console.log("Couldn't find CSS files for Reveal.js at "+cssdir); }

    /* Copy Javascript needed by reveal */
    var jsdir = path.join(resources, "js");
    if (fs.existsSync(jsdir)) fs.copySync(jsdir, path.join(dst, "js"));
    else { console.log("Couldn't find JS files for engine Reveal.js at "+jsdir); }

    /* Copy fonts needed by reveal */    
    var fontdir = path.join(resources, "font");
    if (fs.existsSync(fontdir)) fs.copySync(fontdir, path.join(dst, "font"));
    else { console.log("Couldn't find font files for engine Flowtime at "+fontdir); }

    /* Generate index.html */
    var ft = hb.compile(fs.readFileSync(path.join(resources, "reveal.html"), "utf8"));

    /* Generate index.html */
    var ot = hb.compile(fs.readFileSync(path.join(resources, "outline.html"), "utf8"));

    /* Run the results through the handlebars template (this is one case where we
       definitely want to use handlebars. */
    var tcon = {"slides": context['slides'],
		"metadata": metadata};
    var result = ft(tcon);
    var outline = ot(tcon);

    /* Now load cheerio and perform some HTML transformations.
       TODO: Is there a 'nicer' way to do this, perhaps in conjunction
       with handlebars.  I hate writing literal HTML code.  It seems ugly
       and potentially unsafe. */
    var $ = cheerio.load(result);

    /* Replace any <hero> elements with some surrounding divs */
    $('hero').each(function(i, elem) {
	var was = $(elem).html();
	var to = '<div class="stack-center"><div class="stacked-center">'+was+'</div></div>';
	$(elem).replaceWith(to);
    });

    if (metadata.animation) {
	/* Make any step fragments */
	$('.c-step').each(function(i, elem) {
	    $(elem).removeClass('c-step');
	    $(elem).addClass('ft-fragment');
	});

	/* Make any step fragments */
	$('.c-dim').each(function(i, elem) {
	    $(elem).removeClass('c-dim');
	    $(elem).addClass('ft-fragment');
	    $(elem).addClass('step');
	});

	/* Make any shy fragments */
	$('.c-shy').each(function(i, elem) {
	    $(elem).removeClass('c-shy');
	    $(elem).addClass('ft-fragment');
	    $(elem).addClass('shy');
	});
    }

    /* I used to pretty print the HTML output.  But this messed up
       pre element formatting (and took forever to figure out), so
       no more of that. */
    //var pretty = html.prettyPrint($.html(), { indent_size: 2 });
    //fs.writeFileSync(path.join(dst, "index.html"), pretty);
    fs.writeFileSync(path.join(dst, "index.html"), $.html());
    if (metadata.draft) {
	fs.writeFileSync(path.join(dst, "outline.html"), outline);
    }
}

/* Export these functions for use in main.js.  These essentially form
   the engine API. */
module.exports.resources = resources;
module.exports.generate = generate;
module.exports.name = "Reveal Engine";