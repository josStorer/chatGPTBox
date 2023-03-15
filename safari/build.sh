xcrun safari-web-extension-converter ./build/firefox \
 --project-location ./build/safari --app-name chatGPT-for-Search-Engine \
 --bundle-identifier dev.josStorer.chatGPT-for-Search-Engine --force --no-prompt --no-open
git apply safari/project.patch
xcodebuild archive -project ./build/safari/chatGPT-for-Search-Engine/chatGPT-for-Search-Engine.xcodeproj \
 -scheme "chatGPT-for-Search-Engine (macOS)" -configuration Release -archivePath ./build/safari/chatGPT-for-Search-Engine.xcarchive
xcodebuild -exportArchive -archivePath ./build/safari/chatGPT-for-Search-Engine.xcarchive \
 -exportOptionsPlist ./safari/export-options.plist -exportPath ./build
npm install -D appdmg
rm ./build/safari.dmg
appdmg ./safari/appdmg.json ./build/safari.dmg