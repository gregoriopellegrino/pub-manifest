/**
* Create a publication manifest for the publication.
*
* @param config: the respec configuration object
*/
function create_manifest(config) {
    // This flag controls on what should happen if the full boundary is supposed to be included in the manifest...
    const FULL_BOUNDARY = false;

    // ----------------------------------------------------------------------------------- //
	// Rudimentary check whether the URL is relative or not. Surely not ideal, but I did not want to include a full URI library...
    // (Why, oh why is not URL management part of the default JS environment?)
	const is_relative = (url) => {
        //alert(url);
		return (url[0] === '#' || url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:")) ? false : true;
	};

	const image_type = (img) => {
		if( img.endsWith(".gif") ) {
			return "image/gif";
		} else if( img.endsWith(".png") ) {
			return "image/png";
        } else if( img.endsWith(".bmp") ) {
            return "image/bmp";
		} else if( img.endsWith(".jpg") || img.endsWith(".jpeg") ) {
			return "image/jpeg";
		} else if( img.endsWith(".svg") ) {
			return "image/svg+xml";
        } else if( img.endsWith(".pdf") ) {
            return "application/pdf";
		} else {
			return null;
		}
	};

	const uniq = (arr) => {
	    let buffer = [];
	    return arr.filter( (entry) => {
	        let key = entry.url;
	        if( buffer.indexOf(key) !== -1 ) {
	            // that url has already been seen
	            return false;
	        } else {
	            buffer.push(key);
	            return true;
	        }
	    })
	};

    // There are minor differences between the terms used in the respec config file and the ones in schema.org...
    let person_keys_mapping = {
        "editors"  : "editor",
        "authors"  : "author",
        "creators" : "creator"
    };

    // The id attribute value for the <script> element
    const MANIFEST_ID = "pub_manifest";

    // =====================================================================
    // Add the role=doc-toc attribute to the table of content
    // =====================================================================
    let toc = document.querySelector("nav#toc");
    if(toc) {
        toc.setAttribute("role","doc-toc");
    }

    // =====================================================================
    // Create the manifest static content as a Javascript object
    // =====================================================================
    let manifest = {
        "@context"             : ["https://schema.org", "https://www.w3.org/ns/pub-context"],
        "type"                : "TechArticle",
        "accessMode"           : ["textual", "diagramOnVisual"],
        "accessModeSufficient" : ["textual"],

        "resources"            : [{
            "type"            : "LinkedResource",
            "url"             : "https://www.w3.org/StyleSheets/TR/2016/logos/W3C",
            "encodingFormat"  : "image/svg+xml",
            "description"     : "W3C Logo"           
        },{
            "type"            : "LinkedResource",
            "url"             : "https://www.w3.org/StyleSheets/TR/2016/base.css",
            "rel"             : "stylesheet",
            "encodingFormat"  : "text/css",
            "description"     : "Generic CSS file for W3C TR documents"                   	
        }],

        "links"                : [{
            "type"           : "LinkedResource",
            "url"            : "https://www.w3.org/Consortium/Legal/privacy-statement-20140324",
            "encodingFormat" : "text/html",
            "rel"            : "privacy-policy"
        },{
            "type"           : "LinkedResource",
            "url"            : "https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document",
            "encodingFormat" : "text/html",
            "rel"            : "license describedby"
        },{
            "type"           : "LinkedResource",
            "url"            : "http://www.w3.org/Consortium/Legal/ipr-notice#Copyright",
            "encodingFormat" : "text/html",
            "rel"            : "copyright"
        }]
    }

    // =====================================================================
    // Add the dynamic parts to the manifest object
    // =====================================================================
    // Get the short name to create the canonical URI for the document
    manifest.id = `https://www.w3.org/TR/${config["shortName"]}/`;

    // Get the current URL from the data generated by respec
    manifest.url = document.querySelector("a.u-url").getAttribute("href");

    // Get the publication date from the data generated by respec
    manifest.datePublished = document.querySelector("time.dt-published").getAttribute("datetime");

    // Collect the editors and authors and turn their data into schema.org Person objects
    Object.keys(person_keys_mapping).forEach( (key) => {
        if(config[key] !== undefined) {
        	// Create an array for all the Persons in the same category...
            manifest[person_keys_mapping[key]] = config[key].map( (person) => {
                retval = { "type" : "Person" };
                retval.name = person.name;
                if( person.url !== undefined ) {
                    retval.id = person.url
                }
                retval.affiliation = { "type"  : "Organization", "name" : person.company }
                if( person.companyURL !== undefined ) {
                    retval.affiliation.url = person.companyURL
                }
                return retval;
            })
        }
    })

    // The additional logo and CSS file reference depends on the spec status...
    let styleFile  = "W3C-";
    let logoFile   = undefined;
    let logoFormat = "image/svg+xml";
    let watermark  = undefined;

	// Figure out which style file to use.
	switch(config.specStatus.toUpperCase()) {
		case "CG-DRAFT":
		case "CG-FINAL":
		case "BG-DRAFT":
		case "BG-FINAL":
			styleFile  = config.specStatus.toLowerCase();
			logoFile   = `back-${styleFile}.png`;
			logoFormat = "image/png";
			break;
		case "FPWD":
		case "LC":
		case "WD-NOTE":
		case "LC-NOTE":
			styleFile += "WD";
			logoFile   = "WD";
			break;
		case "WG-NOTE":
		case "FPWD-NOTE":
			styleFile += "WG-NOTE";
			logoFile   = "WG-Note";
			break;
		case "UNOFFICIAL":
			styleFile += "UD";
			logoFile   = "UD.png";
			logoFormat = "image/png";
			watermark  = "UD-watermark.png"
			break;
		case "FINDING":
		case "FINDING-DRAFT":
		case "BASE":
			styleFile = undefined;
			break;
		default:
			styleFile += config.specStatus.toUpperCase();
			logoFile   = config.specStatus.toUpperCase();
	}

	if( styleFile !== undefined ) {
		manifest.resources.push({
	        "type"            : "LinkedResource",
	        "url"             : `https://www.w3.org/StyleSheets/TR/2016/${styleFile}`,
	        "rel"             : "stylesheet",
	        "encodingFormat"  : "text/css",
	        "description"     : "CSS file depending on the status of the document"                   	
		})		
	}
   
	if( logoFile !== undefined ) {
		manifest.resources.push({
	        "type"            : "LinkedResource",
	        "url"             : `https://www.w3.org/StyleSheets/TR/2016/logos/${logoFile}`,
	        "encodingFormat"  : `${logoFormat}`,
	        "description"     : "Sidebar logo reflecting the status of the document"                   	
		})		
	}

	if( watermark !== undefined ) {
		manifest.resources.push({
	        "type"            : "LinkedResource",
	        "url"             : `https://www.w3.org/StyleSheets/TR/2016/logos/${watermark}`,
	        "encodingFormat"  : "image/png",
	        "description"     : "Background watermark reflecting the status of the document"                   	
		})		
	}

    // If the ORCID extension is used, the ORCID logo should also be added to the list of resources
    if( document.querySelector("span.orcid") ) {
        manifest.resources.push({
            "type"            : "LinkedResource",
            "url"             : "images/orcid.gif",
            "encodingFormat"  : "image/gif",
            "description"     : "ORCID logo"                    
        })              
    }

    // =====================================================================
    // Add the dynamic parts that are requested/expected for a full boundary
    // =====================================================================

    // Current strategy: collect
    // - all <a> elements with a relative URL in their href
    // - all <img> elements with a relative URL in their src
    // - all <object> elements with a relative URL in their data
    document.querySelectorAll("object").forEach((element) => {
        let href= element.getAttribute("data");
        if( href && is_relative(href) ) {
            let retval = {
                "type"   : "LinkedResource",
                "url"    : `${href}`,    				
            }
            let type = element.getAttribute("type") || image_type(href);
            if( type ) {
                retval.encodingFormat = type
            }
            manifest.resources.push(retval);
        }
    });
    document.querySelectorAll("img").forEach((element) => {
        let href= element.getAttribute("src");
        if( href && is_relative(href) ) {
            let retval = {
                "type"   : "LinkedResource",
                "url"    : `${href}`    				
            }
            let type = image_type(href);
            if( type ) {
                retval.encodingFormat = type;
            }
            let alt = element.getAttribute("alt");
            if( alt ) {
                retval.description = alt;
            }
            manifest.resources.push(retval);
        }
    });
    document.querySelectorAll("a").forEach((element) => {
        let href= element.getAttribute("href");
        if( href && is_relative(href) ) {
            let retval = {
                "type"   : "LinkedResource",
                "url"    : `${href}`    				
            }
            let type = element.getAttribute("type") || image_type(href);
            if( type ) {
                retval.encodingFormat = type
            }
            let rel = element.getAttribute("rel");
            if( rel ) {
                retval.rel = rel
            }
            let descr = element.getAttribute("title");
            if( descr ) {
                retval.description = descr;
            }
            manifest.resources.push(retval);
        }
    });
    document.querySelectorAll("script").forEach((element) => {
        if( element.getAttribute("class") !== "remove" ) {
            let href= element.getAttribute("src");
            if( href && is_relative(href) ) {
                let retval = {
                    "type"   : "LinkedResource",
                    "url"    : `${href}`                    
                }
                if( href.endsWith(".js") ) {
                    retval.encodingFormat = "application/Javascript"
                } else {
                    let type = element.getAttribute("type");
                    if( type ) {
                        manifest.encodingFormat = type;
                    }
                }
                manifest.resources.push(retval);
            }                
        }
    });

    manifest.resources = uniq(manifest.resources);

    // =====================================================================
    // Add the link to the manifest as well as the manifest itself (in JSON)
    // =====================================================================
    let head = document.getElementsByTagName("head")[0];

    // Set a link to the manifest reference
    let link = document.createElement("link");
    link.setAttribute("rel","publication");
    link.setAttribute("href",`#${MANIFEST_ID}`);
    head.appendChild(link);

    // Set a script element with the manifest content
    let manifest_element = document.createElement("script");
    manifest_element.setAttribute("type","application/ld+json");
    manifest_element.setAttribute("id",MANIFEST_ID);
    manifest_element.text = JSON.stringify(manifest, null, 4);
    head.appendChild(manifest_element);

    // ======================================
    // --------------- DEBUG ----------------
    // ======================================
    // For debug: display the manifest in JSON
    // alert(JSON.stringify(manifest, null, 4));
}

