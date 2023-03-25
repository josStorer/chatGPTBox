git apply safari/project.pre.patch
npm run build
xcrun safari-web-extension-converter ./build/firefox \
 --project-location ./build/safari --app-name "Fission - ChatBox" \
 --bundle-identifier dev.josStorer.chatGPTBox --force --no-prompt --no-open
git apply safari/project.patch
xcodebuild archive -project "./build/safari/Fission - ChatBox/Fission - ChatBox.xcodeproj" \
 -scheme "Fission - ChatBox (macOS)" -configuration Release -archivePath "./build/safari/Fission - ChatBox.xcarchive"
xcodebuild -exportArchive -archivePath "./build/safari/Fission - ChatBox.xcarchive" \
 -exportOptionsPlist ./safari/export-options.plist -exportPath ./build
npm install -D appdmg
rm ./build/safari.dmg
appdmg ./safari/appdmg.json ./build/safari.dmg