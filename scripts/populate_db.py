import requests
import random
import time

API_URL = "http://localhost:8000/api"

def create_user(email, password, role):
    response = requests.post(f"{API_URL}/auth/register", json={
        "email": email,
        "password": password,
        "confirmPassword": password,
        "role": role
    })
    if response.status_code == 201:
        return response.json()
    print(f"Failed to create user {email}: {response.text}")
    # Login to get token if already exists
    response = requests.post(f"{API_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    if response.status_code == 200:
        return response.json()
    print(f"Login failed: {response.text}")
    return None

def create_vacancy(token, title, description, type_="vacancy", specialization="backend"):
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "title": title,
        "description": description,
        "requirements": "Python, FastAPI, React",
        "type": type_,
        "specialization": specialization,
        "salary_from": random.randint(50000, 150000),
        "salary_to": random.randint(150000, 300000),
        "is_salary_hidden": random.choice([True, False]),
        "city": random.choice(["Москва", "Санкт-Петербург", "Казань", "Удаленно"]),
        "is_remote": random.choice([True, False]),
        "status": "active",
        "company_id": 0 # Will be ignored/overridden by backend
    }
    response = requests.post(f"{API_URL}/employer/vacancies", json=data, headers=headers)
    if response.status_code == 200:
        print(f"Created vacancy: {title}")
    else:
        print(f"Failed to create vacancy: {response.text}")

def main():
    print("Starting data population...")
    
    # 1. Create Employer
    employer_email = "employer@example.com"
    employer_token_data = create_user(employer_email, "password123", "employer")
    if not employer_token_data:
        print("Could not get employer token")
        return
    employer_token = employer_token_data["access_token"]
    
    # 2. Create Company
    headers = {"Authorization": f"Bearer {employer_token}"}
    requests.post(f"{API_URL}/companies/", json={
        "name": "Tech Corp",
        "description": "Leading tech company",
        "website": "https://techcorp.com"
    }, headers=headers)

    # 3. Create Vacancies
    vacancies = [
        ("PR Specialist", "vacancy", "PR"),
        ("Journalist", "vacancy", "Journalism"),
        ("Media Director", "vacancy", "MediaCom"),
        ("SMM Manager", "vacancy", "SMM"),
        ("Marketing Lead", "vacancy", "Marketing"),
        ("Junior PR Intern", "internship", "PR"),
        ("Content Creator", "vacancy", "MediaCom"),
        ("Copywriter", "vacancy", "Marketing"),
        ("SMM Intern", "internship", "SMM"),
        ("Editor", "vacancy", "Journalism"),
    ]

    for title, type_, spec in vacancies:
         for i in range(3): # Create multiples
            create_vacancy(employer_token, f"{title} {i+1}", f"Description for {title}", type_, spec)
            
    # 4. Create Applicant
    applicant_email = "applicant@example.com"
    create_user(applicant_email, "password123", "applicant")
    
    print("Data population complete!")

if __name__ == "__main__":
    main()
