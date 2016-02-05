** NOTE ** 
Like all our systems, this is subject to change.  We are intending to add a more comprehensive mod system latter on which
will replace (and improve on) this system.  But the community is already creating mods, and this will make it easier. 

To add a ui mod:
1) Create a file called 'ui_mod_list.js' and add it the ui/mods directory.

2) Format the 'ui_mod_list.js' file as follows:

/* start ui_mod_list */
var global_mod_list = [

];

var scene_mod_list = {
    'connect_to_game': [

    ],
    'game_over': [

    ],
    'icon_atlas': [

    ],
    'live_game': [

    ],
    'load_planet': [

    ],
    'lobby': [

    ],
    'matchmaking': [

    ],
    'new_game': [
  
    ],
    'server_browser': [

    ],
    'settings': [

    ],
    'special_icon_atlas': [

    ],
    'start': [

    ],
    'system_editor': [

    ],
    'transit': [
  
    ]
}
/* end ui_mod_list */

3) Add js and css files to the lists. For example:

var global_mod_list = [
    'custom.css'
    'custom.js'
];

and/or

    'live_game': [
        'scene_specific_custom.css',
        'scene_specific_custom.js'
    ],

Only .css and .js files are currently supported (html fragments will be supported latter).  No naming convention is required, but you should
use very specific names to avoid conflicting with other mods.  Resources such as images and fonts don't need to be specified in the list.

Files will be loaded in the same order as they appear in the list, and the files will be loaded after the relevant base ui files are loaded. 
Files in the 'global_mod_list' will be loaded for every ui scene, while files in the 'scene_mod_list' will only be loaded for the labled scene.
 
4) Tips

    a) File paths should be absolute.  For instance, if you wanted to add hello_mod.js file (located in /mods/global directory) you would use:
    'coui://ui/mods/global/hello_mod.js'  

    [... more here later]