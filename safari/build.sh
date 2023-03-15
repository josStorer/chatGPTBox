xcrun safari-web-extension-converter ./build/firefox \
 --project-location ./build/safari --app-name chatGPTBox \
 --bundle-identifier dev.josStorer.chatGPTBox --force --no-prompt --no-open
git apply safari/project.patch
xcodebuild archive -project ./build/safari/chatGPTBox/chatGPTBox.xcodeproj \
 -scheme "chatGPTBox (macOS)" -configuration Release -archivePath ./build/safari/chatGPTBox.xcarchive
xcodebuild -exportArchive -archivePath ./build/safari/chatGPTBox.xcarchive \
 -exportOptionsPlist ./safari/export-options.plist -exportPath ./build
npm install -D appdmg
rm ./build/safari.dmg
appdmg ./safari/appdmg.json ./build/safari.dmg