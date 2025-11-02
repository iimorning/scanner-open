import UIKit
import CoreLocation
import HealthKit
import AVFoundation
import Firebase

class ViewController: UIViewController {
    
    private let locationManager = CLLocationManager()
    private let healthStore = HKHealthStore()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        FirebaseApp.configure()
        
        locationManager.delegate = self
        locationManager.requestWhenInUseAuthorization()
        
        requestHealthKitPermission()
    }
    
    private func requestHealthKitPermission() {
        let healthDataTypes: Set<HKSampleType> = [
            HKQuantityType.quantityType(forIdentifier: .heartRate)!,
            HKQuantityType.quantityType(forIdentifier: .stepCount)!
        ]
        
        healthStore.requestAuthorization(toShare: nil, read: healthDataTypes) { success, error in
            print("HealthKit permission: \(success)")
        }
    }
}

extension ViewController: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        // Handle location updates
    }
}

