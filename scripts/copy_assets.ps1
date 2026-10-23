$src = "D:\DREADLOCK_Starter_3D_Assets_v0.1.0"
$dest = "D:\Arcade Artificial Hackathon\public\assets"

# Create directories
New-Item -ItemType Directory -Path "$dest\models\characters", "$dest\models\props", "$dest\textures\concrete", "$dest\textures\basalt_floor", "$dest\textures\dark_metal" -Force | Out-Null

# 1. Characters
Copy-Item -Path "$src\Cyberpunk Game Kit - Quaternius-20261023T130557Z-1-001\Cyberpunk Game Kit - Quaternius\Character\Character.gltf" -Destination "$dest\models\characters\guest_runner.gltf" -Force
Copy-Item -Path "$src\kenney_space-kit\Models\GLTF format\astronautA.glb" -Destination "$dest\models\characters\warden_overseer.glb" -Force

# 2. Props
Copy-Item -Path "$src\kenney_space-kit\Models\GLTF format\machine_generator.glb" -Destination "$dest\models\props\prop_generator.glb" -Force
Copy-Item -Path "$src\kenney_space-kit\Models\GLTF format\desk_computer.glb" -Destination "$dest\models\props\prop_entry_relay.glb" -Force
Copy-Item -Path "$src\kenney_space-kit\Models\GLTF format\rock_crystalsLargeA.glb" -Destination "$dest\models\props\prop_power_cell.glb" -Force
Copy-Item -Path "$src\kenney_space-kit\Models\GLTF format\barrels.glb" -Destination "$dest\models\props\prop_barrels.glb" -Force

# 3. Textures - Concrete
Copy-Item -Path "$src\Concrete042A_1K-JPG\Concrete042A_1K-JPG_Color.jpg" -Destination "$dest\textures\concrete\albedo.jpg" -Force
Copy-Item -Path "$src\Concrete042A_1K-JPG\Concrete042A_1K-JPG_NormalGL.jpg" -Destination "$dest\textures\concrete\normal.jpg" -Force
Copy-Item -Path "$src\Concrete042A_1K-JPG\Concrete042A_1K-JPG_Roughness.jpg" -Destination "$dest\textures\concrete\roughness.jpg" -Force

# 4. Textures - Floor
Copy-Item -Path "$src\Tiles088_1K-JPG\Tiles088_1K-JPG_Color.jpg" -Destination "$dest\textures\basalt_floor\albedo.jpg" -Force
Copy-Item -Path "$src\Tiles088_1K-JPG\Tiles088_1K-JPG_NormalGL.jpg" -Destination "$dest\textures\basalt_floor\normal.jpg" -Force
Copy-Item -Path "$src\Tiles088_1K-JPG\Tiles088_1K-JPG_Roughness.jpg" -Destination "$dest\textures\basalt_floor\roughness.jpg" -Force

# 5. Textures - Metal
Copy-Item -Path "$src\Metal045A_1K-JPG\Metal045A_1K-JPG_Color.jpg" -Destination "$dest\textures\dark_metal\albedo.jpg" -Force
Copy-Item -Path "$src\Metal045A_1K-JPG\Metal045A_1K-JPG_NormalGL.jpg" -Destination "$dest\textures\dark_metal\normal.jpg" -Force
Copy-Item -Path "$src\Metal045A_1K-JPG\Metal045A_1K-JPG_Roughness.jpg" -Destination "$dest\textures\dark_metal\roughness.jpg" -Force
Copy-Item -Path "$src\Metal045A_1K-JPG\Metal045A_1K-JPG_Metalness.jpg" -Destination "$dest\textures\dark_metal\metalness.jpg" -Force

Write-Host "ASSETS DEPLOYED TO PUBLIC/ASSETS SUCCESSFULLY"
