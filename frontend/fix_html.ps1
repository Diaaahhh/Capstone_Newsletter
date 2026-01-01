# Fix Recreation
$c = Get-Content 'recreation.html' -Raw
$c = $c -creplace 'href="createcccEvents\.html','href="createrecreation.html'
$c = $c -creplace 'category: "cccEvents"','category: "recreation"'
$c = $c -creplace 'createPage: "createcccEvents\.html"','createPage: "createrecreation.html"'
$c = $c -creplace 'formData\.title \|\| "CCC Event"','formData.title || "Recreation"'
$c | Set-Content 'recreation.html' -NoNewline
Write-Host 'Fixed recreation.html'

# Fix DegreeReview
$c = Get-Content 'degreeReview.html' -Raw
$c = $c -creplace 'href="createcccEvents\.html','href="createdegreeReview.html'
$c = $c -creplace 'category: "cccEvents"','category: "degreeReview"'
$c = $c -creplace 'createPage: "createcccEvents\.html"','createPage: "createdegreeReview.html"'
$c = $c -creplace 'formData\.title \|\| "CCC Event"','formData.title || "Degree Review"'
$c | Set-Content 'degreeReview.html' -NoNewline
Write-Host 'Fixed degreeReview.html'

# Fix Seminars
$c = Get-Content 'seminars.html' -Raw
$c = $c -creplace 'href="createcccEvents\.html','href="createseminars.html'
$c = $c -creplace 'category: "cccEvents"','category: "seminars"'
$c = $c -creplace 'createPage: "createcccEvents\.html"','createPage: "createseminars.html"'
$c = $c -creplace 'formData\.title \|\| "CCC Event"','formData.title || "Seminars"'
$c | Set-Content 'seminars.html' -NoNewline
Write-Host 'Fixed seminars.html'

# Fix Memberships
$c = Get-Content 'memberships.html' -Raw
$c = $c -creplace 'href="createcccEvents\.html','href="creatememberships.html'
$c = $c -creplace 'category: "cccEvents"','category: "memberships"'
$c = $c -creplace 'createPage: "createcccEvents\.html"','createPage: "creatememberships.html"'
$c = $c -creplace 'formData\.title \|\| "CCC Event"','formData.title || "Memberships"'
$c | Set-Content 'memberships.html' -NoNewline
Write-Host 'Fixed memberships.html'

# Fix TrainingProgram
$c = Get-Content 'trainingProgram.html' -Raw
$c = $c -creplace 'href="createcccEvents\.html','href="createtrainingProgram.html'
$c = $c -creplace 'category: "cccEvents"','category: "trainingProgram"'
$c = $c -creplace 'createPage: "createcccEvents\.html"','createPage: "createtrainingProgram.html"'
$c = $c -creplace 'formData\.title \|\| "CCC Event"','formData.title || "Training Program"'
$c | Set-Content 'trainingProgram.html' -NoNewline
Write-Host 'Fixed trainingProgram.html'

# Fix Achievements
$c = Get-Content 'achievements.html' -Raw
$c = $c -creplace 'href="createcccEvents\.html','href="createachievements.html'
$c = $c -creplace 'category: "cccEvents"','category: "achievements"'
$c = $c -creplace 'createPage: "createcccEvents\.html"','createPage: "createachievements.html"'
$c = $c -creplace 'formData\.title \|\| "CCC Event"','formData.title || "Achievements"'
$c | Set-Content 'achievements.html' -NoNewline
Write-Host 'Fixed achievements.html'

# Fix Map
$c = Get-Content 'map.html' -Raw
$c = $c -creplace 'href="createcccEvents\.html','href="createmap.html'
$c = $c -creplace 'category: "cccEvents"','category: "map"'
$c = $c -creplace 'createPage: "createcccEvents\.html"','createPage: "createmap.html"'
$c = $c -creplace 'formData\.title \|\| "CCC Event"','formData.title || "Map"'
$c | Set-Content 'map.html' -NoNewline
Write-Host 'Fixed map.html'

# Fix DeptActivities
$c = Get-Content 'deptActivities.html' -Raw
$c = $c -creplace 'href="createcccEvents\.html','href="createdeptActivities.html'
$c = $c -creplace 'category: "cccEvents"','category: "deptActivities"'
$c = $c -creplace 'createPage: "createcccEvents\.html"','createPage: "createdeptActivities.html"'
$c = $c -creplace 'formData\.title \|\| "CCC Event"','formData.title || "Dept Activities"'
$c | Set-Content 'deptActivities.html' -NoNewline
Write-Host 'Fixed deptActivities.html'

# Fix Others
$c = Get-Content 'others.html' -Raw
$c = $c -creplace 'href="createcccEvents\.html','href="createothers.html'
$c = $c -creplace 'category: "cccEvents"','category: "others"'
$c = $c -creplace 'createPage: "createcccEvents\.html"','createPage: "createothers.html"'
$c = $c -creplace 'formData\.title \|\| "CCC Event"','formData.title || "Others"'
$c | Set-Content 'others.html' -NoNewline
Write-Host 'Fixed others.html'
