# Joplin Autotagging Plugin
A Joplin plugin which allows autotagging based on user defined words. Also allows batch autotag all notes.

# FAQ
## How does it work?
User can define multiple target words and for each word bunch of tags. Then every time a note is changed, the plugin scans for the target words and, if found, adds tags to that note.

## How does batch autotag work?
Batch autotagging uses same settings as the normal autotagging, but instead is started by user. The plugin scans all notes for the target words and applies tags as usual. At the end of processing, user will receive a list of notes that got tags added and below them a list of notes added. User can jump to specific notes from that result list. User can also click any added tag to remove them from the note. Only the tags that plugin added will be shown on the list.

## Where are the settings!?
Under Tools on the menu bar.

![image](https://user-images.githubusercontent.com/12672127/138317969-ad3ecb8c-2c7f-4389-bac0-11ce186b4926.png)

## Why didn't you add the settings in the options view!?
Because Joplin lacks functionality to customize setting forms. That, or maybe I'm just too dumb. Maybe both. ¯\_(ツ)_/¯ 

## Why did you create this plugin?
I'm too lazy to add tags to my notes, but I'm not lazy enough to write a plugin to do that for me.

## When are you going to update this!? / I have a feature that I would like to see! Will you implement it???
Dunno. I usually create plugins and addons for my pleasure only and I tend to update them only when bugs or lack of features annoys me enough. Sorry. But try your luck anyway. I might do something. :)

# Installing (plagiarized from [Joplin plugins.md](https://github.com/laurent22/joplin/blob/dev/readme/plugins.md))
To install a plugin press the Install Plugin button within the `Plugins` page of the [Configuration screen](https://github.com/laurent22/joplin/blob/dev/readme/config_screen.md) and select the *.jpl file. Alternatively you can copy the *.jpl to your profile's `plugins` directory directory `~/.config/joplin-desktop/plugins` (This path might be different on your device - check at the top of the `Options` page in the [Configuration screen](https://github.com/laurent22/joplin/blob/dev/readme/config_screen.md)). The plugin will be automatically loaded and executed when you restart the application. You may need to check Joplin is not minimising to the system tray/notification area rather than fully closing.

# Screenshots
![settings](https://user-images.githubusercontent.com/12672127/137621262-389631d5-5c17-4668-8d53-548cf49ad5cf.png)
![regex tester](https://user-images.githubusercontent.com/12672127/137621285-19338fb9-0979-430b-860e-3872817a9f8d.png)
![progress](https://user-images.githubusercontent.com/12672127/138316828-5c3d6d5b-8a4e-402f-b627-fb7f549420c1.png)
![results](https://user-images.githubusercontent.com/12672127/138316832-98efffd6-4583-428a-bf75-5b46e659c4ad.png)
